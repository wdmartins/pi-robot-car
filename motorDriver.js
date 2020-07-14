'use strict';

const bunyan = require('bunyan');
const rpiGpio = require('rpi-gpio');
const GpioDef = require('./rpiGpioDef.js');
const sleep = require('sleep-promise');
const Gpio = require('pigpio').Gpio;

const DEFAULT_GPIO_MOTOR_LATCH = GpioDef.PHY.GPIO29;        // Pin 40
const DEFAULT_GPIO_MOTOR_CLOCK = GpioDef.PHY.GPIO28;        // Pin 38
const DEFAULT_GPIO_MOTOR_DATA = GpioDef.PHY.GPIO27;         // Pin 36
const DEFAULT_GPIO_PWM_LEFT_REAR = GpioDef.BCM.GPIO21;      // Pin 29
const DEFAULT_GPIO_PWM_RIGHT_REAR = GpioDef.BCM.GPIO22;     // Pin 31
const DEFAULT_GPIO_PWM_LEFT_FRONT = GpioDef.BCM.GPIO23;     // Pin 33
const DEFAULT_GPIO_PWM_RIGHT_FRONT = GpioDef.BCM.GPIO24;    // Pin 35

const DEFAULT_SPEED = 255; // Max Speed
const DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS = 1; // Shift register clock

const MOVE_REGISTER = {
    STOP: 0,        // 00000000
    FORWARD: 57,    // 00111001
    BACKWARD: 198,  // 11000110
    RIGHT: 106,     // 01101010
    LEFT: 149       // 10010101
};

const BIT = [
    1,   // 00000001
    2,   // 00000010
    4,   // 00000100
    8,   // 00001000
    16,  // 00010000
    32,  // 00100000
    64,  // 01000000
    128, // 10000000
];

const RUN_MODE = {
    FORWARD: 1,
    BACKWARD: 2,
    BRAKE: 3,
    RELEASE: 4
};

let MotorDriver = function(log) {
    let _that = this;
    let motorLatchPin;
    let motorDataPin;
    let motorClockPin;
    let leftFrontPwm;
    let leftRearPwm;
    let rightFrontPwm;
    let rightRearPwm;
    let _currentSpeed = 0;
    let _moveTimer;

    const logger = log ||  bunyan.createLogger({
        name: 'motorDriver',
        stream: process.stdout
    });

    const setSpeed = (leftRear, leftFront, rightRear, rightFront) => {
        let defaultSpeed = DEFAULT_SPEED;
        if (arguments.length === 2) {
            defaultSpeed = leftRear;
        }
        leftRearPwm.pwmWrite(leftRear == undefined ? defaultSpeed : leftRear);
        rightRearPwm.pwmWrite(rightRear == undefined ? defaultSpeed : rightRear);
        leftFrontPwm.pwmWrite(leftFront == undefined ? defaultSpeed : leftFront);
        rightFrontPwm.pwmWrite(rightFront == undefined ? defaultSpeed : rightFront);
        _currentSpeed = defaultSpeed;
    };

    const setRegister = (byte) => {
        return new Promise(async (resolve, reject) => {
            logger.info(`[MOTORDRIVER] Set Register to ${byte}`);

            const setupController = function() {
                return new Promise((resolve, reject) => {
                    rpiGpio.write(motorLatchPin, false, (err) => {
                        if (err) reject(err);
                        rpiGpio.write(motorDataPin, false, (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                    });
                });
            };

            const writeRegister = function (data) {
                return new Promise( async (resolve, reject) => {
                    await sleep(DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS);
                    rpiGpio.write(motorClockPin, false, (err) => {
                        if (err) reject(err);
                        rpiGpio.write(motorDataPin, data, async (err) => {
                            if (err) reject(err);
                            await sleep(DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS);
                            rpiGpio.write(motorClockPin, true, (err) => {
                                if (err) reject(err);
                                resolve();
                            });
                        });
                    });
                });
            };

            await setupController();

            for (let i=0; i < 8; i++) {
                await writeRegister(byte & BIT[7-i] ? true : false);
            }

            rpiGpio.write(motorLatchPin, true,  (err) => {
                if(err) reject(err);
                resolve();
            });
        });
    };

    this.initializeController = async (config) => {
        config = config || {};
        // Initialize PWM
        leftFrontPwm = new Gpio(config.leftFrontPwm || DEFAULT_GPIO_PWM_LEFT_FRONT, {mode: Gpio.OUTPUT});
        leftRearPwm = new Gpio(config.leftRearPwm || DEFAULT_GPIO_PWM_LEFT_REAR, {mode: Gpio.OUTPUT});
        rightFrontPwm = new Gpio(config.rightFrontPwm || DEFAULT_GPIO_PWM_RIGHT_FRONT, {mode: Gpio.OUTPUT});
        rightRearPwm = new Gpio(config.rightRearPwm || DEFAULT_GPIO_PWM_RIGHT_REAR, {mode: Gpio.OUTPUT});

        // Initialize shift register to control individual DC Motors
        motorDataPin = config.dataGpio || DEFAULT_GPIO_MOTOR_DATA;
        motorLatchPin = config.latchGpio || DEFAULT_GPIO_MOTOR_LATCH;
        motorClockPin = config.clockGpio || DEFAULT_GPIO_MOTOR_CLOCK;

        const gpioSetup = function () {
            return new Promise((resolve) => {
                // rpiGpio.setMode(rpiGpio.MODE_RPI);
                rpiGpio.setup(motorDataPin, rpiGpio.DIR_OUT, function(err) {
                    if (err) throw err;
                    logger.info(`[MotorDriver] Set Data Pin ${motorDataPin}`);
                    rpiGpio.setup(motorLatchPin, rpiGpio.DIR_OUT, function(err) {
                        if (err) throw err;
                        logger.info(`[MotorDriver] Set Latch Pin ${motorLatchPin}`);
                        rpiGpio.setup(motorClockPin, rpiGpio.DIR_OUT, function(err) {
                            if (err) throw err;
                            logger.info(`[MotorDriver] Set Clock Pin ${motorClockPin}`);
                            resolve();
                            logger.info('[TEST] Resolving gpioSetup...');
                        });
                    });
                });
            });
        };
        logger.info('[TEST] Before gpioSetup...');
        await gpioSetup();
        logger.info('[TEST] After gpioSetup...');
        setSpeed(0);
        return setRegister(MOVE_REGISTER.STOP);
    };

    const run = (direction, speed, time, cbEnd) => {
        speed = speed || _currentSpeed || DEFAULT_SPEED;
        direction = direction || MOVE_REGISTER.FORWARD;
        cbEnd = cbEnd || {};
        if (_moveTimer) {
            clearTimeout(_moveTimer);
            _moveTimer = null;
        }
        logger.debug('Runing at speed', speed);
        setSpeed(speed);
        if (time) {
            _moveTimer = setTimeout(() => {
                setRegister(MOVE_REGISTER.STOP).then(cbEnd);
            }, time);
        }
        return setRegister(direction);
    };

    this.moveForward = async (speed, time, cbEnd) => {
        return run(MOVE_REGISTER.FORWARD, speed, time, cbEnd);
    };

    this.moveBackward = async (speed, time, cbEnd) => {
        return run(MOVE_REGISTER.BACKWARD, speed, time, cbEnd);
    };

    this.moveLeft = async (speed, time, cbEnd) => {
        return run(MOVE_REGISTER.LEFT, speed, time, cbEnd);
    };

    this.moveRight = async (speed, time, cbEnd) => {
        return run(MOVE_REGISTER.RIGHT, speed, time, cbEnd);
    };

    this.stopAllMotors = () => {
        if (_moveTimer) {
            clearTimeout(_moveTimer);
            _moveTimer = null;
        }
        return setRegister(MOVE_REGISTER.STOP);
    };
};

module.exports = MotorDriver;
module.exports.RUN_MODE = MOVE_REGISTER;