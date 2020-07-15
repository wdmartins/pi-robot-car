/* eslint-disable no-bitwise */
'use strict';

const bunyan = require('bunyan');
const GpioDef = require('./rpiGpioDef.js');
const sleep = require('sleep-promise');
const { Gpio } = require('pigpio');

const DEFAULT_GPIO_MOTOR_LATCH = GpioDef.BCM.GPIO29;        // Pin 40
const DEFAULT_GPIO_MOTOR_CLOCK = GpioDef.BCM.GPIO28;        // Pin 38
const DEFAULT_GPIO_MOTOR_DATA = GpioDef.BCM.GPIO27;         // Pin 36
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
    128  // 10000000
];

const MotorDriver = function (log) {
    let motorLatchPin;
    let motorDataPin;
    let motorClockPin;
    let leftFrontPwm;
    let leftRearPwm;
    let rightFrontPwm;
    let rightRearPwm;
    let _currentSpeed = 0;
    let _moveTimer;

    const logger = log || bunyan.createLogger({
        name: 'motorDriver',
        stream: process.stdout
    });

    const digitalWritePromise = async (pin, value, time) => {
        time = time || 0;
        pin.digitalWrite(value);
        await sleep(time);
    };

    const setSpeed = (leftRear, leftFront, rightRear, rightFront) => {
        let defaultSpeed = DEFAULT_SPEED;
        if (arguments.length === 2) {
            defaultSpeed = leftRear;
        }
        leftRearPwm.pwmWrite(leftRear || defaultSpeed);
        rightRearPwm.pwmWrite(rightRear || defaultSpeed);
        leftFrontPwm.pwmWrite(leftFront || defaultSpeed);
        rightFrontPwm.pwmWrite(rightFront || defaultSpeed);
        _currentSpeed = defaultSpeed;
    };

    const setRegister = async byte => {
        logger.info(`[MOTORDRIVER] Set Register to ${byte}`);

        const setupController = async function () {
            await digitalWritePromise(motorLatchPin, 0, DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS)
                .then(digitalWritePromise(motorDataPin, 0, DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS));
        };

        const writeRegister = async function (data) {
            await digitalWritePromise(motorClockPin, 0, DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS)
                .then(digitalWritePromise(motorDataPin, data, DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS)
                    .then(digitalWritePromise(motorClockPin, 1, DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS)));
        };

        await setupController();

        for (let i = 0; i < 8; i++) {
            // eslint-disable-next-line no-unneeded-ternary
            writeRegister(byte & BIT[7 - i] ? true : false);
        }

        await digitalWritePromise(motorLatchPin, 1, DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS);
    };

    this.initializeController = async config => {
        config = config || {};
        // Initialize PWM
        leftFrontPwm = new Gpio(config.leftFrontPwm || DEFAULT_GPIO_PWM_LEFT_FRONT, { mode: Gpio.OUTPUT });
        leftRearPwm = new Gpio(config.leftRearPwm || DEFAULT_GPIO_PWM_LEFT_REAR, { mode: Gpio.OUTPUT });
        rightFrontPwm = new Gpio(config.rightFrontPwm || DEFAULT_GPIO_PWM_RIGHT_FRONT, { mode: Gpio.OUTPUT });
        rightRearPwm = new Gpio(config.rightRearPwm || DEFAULT_GPIO_PWM_RIGHT_REAR, { mode: Gpio.OUTPUT });

        // Initialize shift register to control individual DC Motors
        motorDataPin = new Gpio(config.dataGpio || DEFAULT_GPIO_MOTOR_DATA, { mode: Gpio.OUTPUT });
        motorLatchPin = new Gpio(config.latchGpio || DEFAULT_GPIO_MOTOR_LATCH, { mode: Gpio.OUTPUT });
        motorClockPin = new Gpio(config.clockGpio || DEFAULT_GPIO_MOTOR_CLOCK, { mode: Gpio.OUTPUT });

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

    this.moveForward = async (speed, time, cbEnd) => run(MOVE_REGISTER.FORWARD, speed, time, cbEnd);

    this.moveBackward = async (speed, time, cbEnd) => run(MOVE_REGISTER.BACKWARD, speed, time, cbEnd);

    this.moveLeft = async (speed, time, cbEnd) => run(MOVE_REGISTER.LEFT, speed, time, cbEnd);

    this.moveRight = async (speed, time, cbEnd) => run(MOVE_REGISTER.RIGHT, speed, time, cbEnd);

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
