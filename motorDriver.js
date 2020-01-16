'use strict';

const bunyan = require('bunyan');
const rpiGpio = require('rpi-gpio');
const GpioDef = require('./rpiGpioDef.js');
const sleep = require('sleep-promise');

let logger;
const DEFAULT_GPIO_MOTOR_LATCH = GpioDef.PHY.GPIO29; // 40
const DEFAULT_GPIO_MOTOR_CLOCK = GpioDef.PHY.GPIO28; // 38
const DEFAULT_GPIO_MOTOR_DATA = GpioDef.PHY.GPIO27; // 36
const DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS = 1;
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
const MOTOR = {
    LEFT_FRONT: 0,
    RIGHT_FRONT: 1,
    LEFT_REAR: 2,
    RIGHT_REAR: 3
};
const MOTOR1_A = 3;
const MOTOR1_B = 2;
const MOTOR2_A = 4;
const MOTOR2_B = 1;
const MOTOR4_A = 0;
const MOTOR4_B = 6;
const MOTOR3_A = 5;
const MOTOR3_B = 7;
const MOTOR_MAP = [
    {
        a: MOTOR1_A,
        b: MOTOR1_B
    },
    {
        a: MOTOR2_A,
        b: MOTOR2_B
    },
    {
        a: MOTOR3_A,
        b: MOTOR3_B
    },
    {
        a: MOTOR4_A,
        b: MOTOR4_B
    }
];

let MotorDriver = function (Gpio, log) {
    let registerByte = 0;
    let _that = this;
    let motorLatchPin;
    let motorDataPin;
    let motorClockPin;

    logger = log ||  bunyan.createLogger({
        name: 'motorDriver',
        stream: process.stdout
    });

    let setRegister = (byte) => {
        return new Promise(async (resolve, reject) => {
            logger.info(`[MOTORDRIVER] Set Register to ${byte}`);

            const setupController = function() {
                return new Promise((resolve, reject) => {
                    rpiGpio.write(motorLatchPin, false, (err) => {
                        if (err) reject(err);
                        logger.info('Wrote false to latch');
                        rpiGpio.write(motorDataPin, false, (err) => {
                            if (err) reject(err);
                            logger.info('Wrote false to data');
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
                        logger.info('Wrote false to clock');
                        rpiGpio.write(motorDataPin, data, async (err) => {
                            if (err) reject(err);
                            logger.info(`Wrote ${data} to data`);
                            await sleep(DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS);
                            rpiGpio.write(motorClockPin, true, (err) => {
                                if (err) reject(err);
                                logger.info('Wrote true to clock');
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
                logger.info('Wrote true to latch');
                resolve();
            });
        });
    };

    this.initializeController = async (latchGpio, clockGpio, dataGpio) => {
        // Initialize PWM
        new Gpio(GpioDef.BCM.GPIO21, {mode: Gpio.OUTPUT}).pwmWrite(255);
        new Gpio(GpioDef.BCM.GPIO22, {mode: Gpio.OUTPUT}).pwmWrite(255);
        new Gpio(GpioDef.BCM.GPIO23, {mode: Gpio.OUTPUT}).pwmWrite(255);
        new Gpio(GpioDef.BCM.GPIO24, {mode: Gpio.OUTPUT}).pwmWrite(255);

        // Initialize shift register to control individual DC Motors
        motorDataPin = dataGpio || DEFAULT_GPIO_MOTOR_DATA;
        motorLatchPin = latchGpio || DEFAULT_GPIO_MOTOR_LATCH;
        motorClockPin = clockGpio || DEFAULT_GPIO_MOTOR_CLOCK;

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
                        });
                    });
                });
            });
        };
        await gpioSetup();
        registerByte = 0;
        return setRegister(registerByte);
    };

    this.runMotor = (motorNumber, runMode) => {
        runMode = runMode || RUN_MODE.FORWARD;
        logger.info(`[MotorDriver] motorNumber: ${motorNumber}, runMode: ${runMode}`);
        logger.info(`[MotorDriver] MOTOR_MAP = ${JSON.stringify(MOTOR_MAP[motorNumber])}`);
        let a = MOTOR_MAP[motorNumber].a;
        let b = MOTOR_MAP[motorNumber].b;
        switch(runMode) {
            case RUN_MODE.FORWARD:
                registerByte = registerByte | BIT[a];
                registerByte = registerByte & ~BIT[b];
            break;
            case RUN_MODE.BACKWARD:
                registerByte = registerByte & ~BIT[a];
                registerByte = registerByte | BIT[b];
            break;
            case RUN_MODE.RELEASE:
                registerByte = registerByte & ~BIT[a];
                registerByte = registerByte & ~BIT[b];
            break;
        }
        return setRegister(registerByte);
    };

    this.moveForward = async (time, cb) => {};

    this.moveBackward = async (time, cb) => {};

    this.moveLeft = async (time, cb) => {};

    this.moveRight = async (time, cb) => {};

    this.stopAllMotors = () => {
        registerByte = 0;
        return setRegister(registerByte);
    };

    this.test = () => {
        logger.info(`[MotorDriver] MOTOR: ${JSON.stringify(MOTOR)}`);
        logger.info(`[MotorDriver] Left Front: ${MOTOR.LEFT_FRONT}`);
        return _that.runMotor(MOTOR.LEFT_FRONT, RUN_MODE.FORWARD);
    };
};

module.exports = MotorDriver;