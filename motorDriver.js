'use strict';

const bunyan = require('bunyan');
const Gpio = require('onoff').Gpio;
const GpioDef = require('./rpiGpioDef.js');
let logger;
const DEFAULT_GPIO_MOTOR_LATCH = GpioDef.BCM.GPIO29;
const DEFAULT_GPIO_MOTOR_CLOCK = GpioDef.BCM.GPIO28;
const DEFAULT_GPIO_MOTOR_DATA = GpioDef.BCM.GPIO27;
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

let MotorDriver = function (log) {
    let motorLatch;
    let motorClock;
    let motorData;
    let registerByte = 0;
    let movingTimer;
    let _that = this;

    logger = log ||  bunyan.createLogger({
        name: 'motorDriver',
        stream: process.stdout
    });

    let setRegister = (byte) => {
        motorLatch.writeSync(Gpio.LOW);
        motorData.writeSync(Gpio.LOW);

        for (let i=0; i < 8; i++) {
            motorClock.writeSync(Gpio.LOW);
            motorData.writeSync( byte & BIT[7-i] ? Gpio.HIGH : Gpio.LOW);
            motorClock.writeSync(Gpio.HIGH);
        }
        motorLatch.writeSync(Gpio.HIGH);
    };

    this.initializeController = (latchGpio, clockGpio, dataGpio) => {
        motorLatch = new Gpio(latchGpio || DEFAULT_GPIO_MOTOR_LATCH, 'out');
        motorClock = new Gpio(clockGpio || DEFAULT_GPIO_MOTOR_CLOCK, 'out');
        motorData = new Gpio(dataGpio || DEFAULT_GPIO_MOTOR_DATA, 'out');
        registerByte = 0;
        setRegister(registerByte);
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
        setRegister(registerByte);
    };

    this.moveForward = async (time, cb) => {
        _that.runMotor(MOTOR.LEFT_FRONT, RUN_MODE.FORWARD);
        _that.runMotor(MOTOR.RIGHT_FRONT, RUN_MODE.FORWARD);
        _that.runMotor(MOTOR.LEFT_REAR, RUN_MODE.FORWARD);
        _that.runMotor(MOTOR.RIGHT_REAN, RUN_MODE.FORWARD);
        if (time) {
            setTimeout(() => {
                this.stopAllMotors();
                cb && cb();
            }, time);
        }
        return;
    };

    this.moveBackward = async (time, cb) => {
        _that.runMotor(MOTOR.LEFT_FRONT, RUN_MODE.BACKWARD);
        _that.runMotor(MOTOR.RIGHT_FRONT, RUN_MODE.BACKWARD);
        _that.runMotor(MOTOR.LEFT_REAR, RUN_MODE.BACKWARD);
        _that.runMotor(MOTOR.RIGHT_REAN, RUN_MODE.BACKWARD);
        if (time) {
            setTimeout(() => {
                this.stopAllMotors();
                cb && cb();
            }, time);
        }
        return;
    };

    this.moveLeft = async (time, cb) => {
        _that.runMotor(MOTOR.LEFT_FRONT, RUN_MODE.BACKWARD);
        _that.runMotor(MOTOR.RIGHT_FRONT, RUN_MODE.FORWARD);
        _that.runMotor(MOTOR.LEFT_REAR, RUN_MODE.BACKWARD);
        _that.runMotor(MOTOR.RIGHT_REAN, RUN_MODE.FORWARD);
        if (time) {
            setTimeout(() => {
                this.stopAllMotors();
                cb && cb();
            }, time);
        }
        return;
    };

    this.moveRight = async (time, cb) => {
        _that.runMotor(MOTOR.LEFT_FRONT, RUN_MODE.FORWARD);
        _that.runMotor(MOTOR.RIGHT_FRONT, RUN_MODE.BACKWARD);
        _that.runMotor(MOTOR.LEFT_REAR, RUN_MODE.FORWARD);
        _that.runMotor(MOTOR.RIGHT_REAN, RUN_MODE.BACKWARD);
        if (time) {
            setTimeout(() => {
                this.stopAllMotors();
                cb && cb();
            }, time);
        }
        return;
    };

    this.stopAllMotors = () => {
        _that.runMotor(MOTOR.LEFT_FRONT, RUN_MODE.RELEASE);
        _that.runMotor(MOTOR.RIGHT_FRONT, RUN_MODE.RELEASE);
        _that.runMotor(MOTOR.LEFT_REAR, RUN_MODE.RELEASE);
        _that.runMotor(MOTOR.RIGHT_REAR, RUN_MODE.RELEASE);
    };

    this.test = () => {
        logger.info(`[MotorDriver] MOTOR: ${JSON.stringify(MOTOR)}`);
        logger.info(`[MotorDriver] Left Front: ${MOTOR.LEFT_FRONT}`);
        _that.runMotor(MOTOR.LEFT_FRONT, RUN_MODE.FORWARD);
    };
};

module.exports = MotorDriver;