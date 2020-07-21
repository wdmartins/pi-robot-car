/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-bitwise */
'use strict';

const logger = require('./logger').logger('MOTOR-DRV');
const GpioDef = require('./rpiGpioDef.js');
const sleep = require('sleep-promise');
const { Gpio } = require('pigpio');

// Default values for the motors controller.
const DEFAULT_GPIO_MOTOR_LATCH = GpioDef.BCM.GPIO29;        // Pin 40
const DEFAULT_GPIO_MOTOR_CLOCK = GpioDef.BCM.GPIO28;        // Pin 38
const DEFAULT_GPIO_MOTOR_DATA = GpioDef.BCM.GPIO27;         // Pin 36
const DEFAULT_GPIO_PWM_LEFT_REAR = GpioDef.BCM.GPIO21;      // Pin 29
const DEFAULT_GPIO_PWM_RIGHT_REAR = GpioDef.BCM.GPIO22;     // Pin 31
const DEFAULT_GPIO_PWM_LEFT_FRONT = GpioDef.BCM.GPIO23;     // Pin 33
const DEFAULT_GPIO_PWM_RIGHT_FRONT = GpioDef.BCM.GPIO24;    // Pin 35

const DEFAULT_SPEED = 255; // Max Speed
const DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS = 1; // Shift register clock

// Values for the shift register of the motor controller.
const MOVE_REGISTER = {
    STOP: 0,        // 00000000
    FORWARD: 57,    // 00111001
    BACKWARD: 198,  // 11000110
    RIGHT: 106,     // 01101010
    LEFT: 149       // 10010101
};

// Bit array
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

/**
 * Controls the wheels' motors driver.
 *
 */
const MotorDriver = function () {
    let motorLatchPin;
    let motorDataPin;
    let motorClockPin;
    let leftFrontPwm;
    let leftRearPwm;
    let rightFrontPwm;
    let rightRearPwm;
    let _currentSpeed = 0;
    let _moveTimer;

    logger.info('Initializing motorDriver...');
    /**
     * Writes the given digital value to the given GPIO number and resolves the promise after the given time.
     *
     * @param {number} pin - The GPIO pin number.
     * @param {number} value - The digital value.
     * @param {number} time - The time before resolving the promise.
     */
    const digitalWritePromise = async (pin, value, time) => {
        time = time || 0;
        pin.digitalWrite(value);
        await sleep(time);
    };

    /**
     * Sets the speed of the individual wheel motors.
     *
     * @param {number} leftRear - The speed of the left rear wheel motor.
     * @param {number} leftFront - The speed of the left front wheel motor.
     * @param {number} rightRear - The speed of the right read wheel motor.
     * @param {number} rightFront - The speed of the right front wheel motor.
     */
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

    /**
     * Sets the given value to the motor driver register.
     *
     * @param {number} byte - The motor driver register value.
     */
    const setRegister = async byte => {
        logger.info(`Set Register to ${byte}`);

        const setupController = async function () {
            await digitalWritePromise(motorLatchPin, 0, DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS)
                .then(digitalWritePromise(motorDataPin, 0, DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS));
        };

        const writeRegister = async function (data) {
            await digitalWritePromise(motorClockPin, 0, DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS)
                .then(digitalWritePromise(motorDataPin, data, DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS)
                    .then(digitalWritePromise(motorClockPin, 1, DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS)));
        };

        await setupController()
            .then(writeRegister(byte & BIT[7] ? true : false))
            .then(writeRegister(byte & BIT[6] ? true : false))
            .then(writeRegister(byte & BIT[5] ? true : false))
            .then(writeRegister(byte & BIT[4] ? true : false))
            .then(writeRegister(byte & BIT[3] ? true : false))
            .then(writeRegister(byte & BIT[2] ? true : false))
            .then(writeRegister(byte & BIT[1] ? true : false))
            .then(writeRegister(byte & BIT[0] ? true : false))
            .then(digitalWritePromise(motorLatchPin, 1, DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS));

        // for (let i = 0; i < 8; i++) {
        //     writeRegister(byte & BIT[7 - i] ? true : false);
        // }

        // await digitalWritePromise(motorLatchPin, 1, DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS);
    };

    /**
     * Configures the motor driver controller and sets the motors to a stop.
     *
     * @param {object} config - The motor driver configuration object.
     * @param {number} config.leftFrontPwm - The GPIO to configure a PWM for the left front wheel motor.
     * @param {number} config.leftRearPwm - The GPIO to configure a PWM for the left rear wheel motor.
     * @param {number} config.rightFrontPwm - The GPIO to configure a PWM for the right front wheel motor.
     * @param {number} config.rightRearPwm - The GPIO to configure a PWM for the right read wheel motor.
     * @returns {Promise} - A promise that resolves when the controller configuration is finalized.
     */
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

    /**
     * Sets the motor diver controller so it moves in the given direction at the given speed.
     *
     * @param {MOVE_REGISTER} direction - The moving direction.
     * @param {number} speed - The moving speed.
     * @param {number} time - The moving time.
     * @param {Function} cbEnd - The callback to be invoked when the given time has elapsed.
     * @returns {Promise} - A promise that resolved when the motor driver controller setup is completed.
     */
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

    /**
     * Sets the motor diver controller so it moves in the forward direction at the given speed.
     *
     * @param {number} speed - The moving speed.
     * @param {number} time - The moving time.
     * @param {Function} cbEnd - The callback to be invoked when the given time has elapsed.
     * @returns {Promise} - A promise that resolved when the motor driver controller setup is completed.
     */
    this.moveForward = async (speed, time, cbEnd) => run(MOVE_REGISTER.FORWARD, speed, time, cbEnd);

    /**
     * Sets the motor diver controller so it moves in the backward direction at the given speed.
     *
     * @param {number} speed - The moving speed.
     * @param {number} time - The moving time.
     * @param {Function} cbEnd - The callback to be invoked when the given time has elapsed.
     * @returns {Promise} - A promise that resolved when the motor driver controller setup is completed.
     */
    this.moveBackward = async (speed, time, cbEnd) => run(MOVE_REGISTER.BACKWARD, speed, time, cbEnd);

    /**
     * Sets the motor diver controller so it moves to the left at the given speed.
     *
     * @param {number} speed - The moving speed.
     * @param {number} time - The moving time.
     * @param {Function} cbEnd - The callback to be invoked when the given time has elapsed.
     * @returns {Promise} - A promise that resolved when the motor driver controller setup is completed.
     */
    this.moveLeft = async (speed, time, cbEnd) => run(MOVE_REGISTER.LEFT, speed, time, cbEnd);

    /**
     * Sets the motor diver controller so it moves to the right at the given speed.
     *
     * @param {number} speed - The moving speed.
     * @param {number} time - The moving time.
     * @param {Function} cbEnd - The callback to be invoked when the given time has elapsed.
     * @returns {Promise} - A promise that resolved when the motor driver controller setup is completed.
     */
    this.moveRight = async (speed, time, cbEnd) => run(MOVE_REGISTER.RIGHT, speed, time, cbEnd);

    /**
     * Sets the motor driver controller so it stops all motors.
     *
     * @returns {Promise} - A promise that resolved when the motor driver controller setup is completed.
     */
    this.stopAllMotors = () => {
        if (_moveTimer) {
            clearTimeout(_moveTimer);
            _moveTimer = null;
        }
        return setRegister(MOVE_REGISTER.STOP);
    };

    logger.info('Initialized motorDriver');
};

module.exports = MotorDriver;
module.exports.RUN_MODE = MOVE_REGISTER;
