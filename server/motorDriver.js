/* eslint-disable max-lines-per-function */
/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-bitwise */
'use strict';

const logger = require('./logger').logger('MOTOR-DRV');
const GpioDef = require('./rpiGpioDef.js');
const { Gpio } = require('pigpio');

// Default values for the motors controller.
const DEFAULT_GPIO_MOTOR_LATCH = GpioDef.BCM.GPIO29;        // Pin 40
const DEFAULT_GPIO_MOTOR_CLOCK = GpioDef.BCM.GPIO28;        // Pin 38
const DEFAULT_GPIO_MOTOR_DATA = GpioDef.BCM.GPIO27;         // Pin 36
const DEFAULT_GPIO_PWM_LEFT_REAR = GpioDef.BCM.GPIO21;      // Pin 29
const DEFAULT_GPIO_PWM_RIGHT_REAR = GpioDef.BCM.GPIO22;     // Pin 31
const DEFAULT_GPIO_PWM_LEFT_FRONT = GpioDef.BCM.GPIO23;     // Pin 33
const DEFAULT_GPIO_PWM_RIGHT_FRONT = GpioDef.BCM.GPIO24;    // Pin 35

const DEFAULT_SPEED = 150;
const DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS = 1; // Shift register clock
const MINIMUM_SPEED = 50;
const MAXIMUM_SPEED = 200; // 255 will crash the Raspberry when running on batteries.

// Values for the shift register of the motor controller.
const MOVE_REGISTER = {
    STOP: 0,            // 00000000
    FORWARD: 57,        // 00111001
    BACKWARD: 198,      // 11000110
    RIGHT: 106,         // 01101010
    LEFT: 149,          // 10010101
    FORWARD_LEFT: 17,   // 00010001
    FORWARD_RIGHT: 40,  // 00101000
    BACKWARD_LEFT: 66,  // 01000010
    BACKWARD_RIGHT: 132 // 10000100
};

// Register to direction
const REGISTER_TO_DIRECTION = {
    0: 'Stop',              // 00000000
    57: 'Forward',          // 00111001
    198: 'Backward',        // 11000110
    106: 'Right',           // 01101010
    149: 'Left',            // 10010101
    17: 'Forward-Left',     // 00010001
    40: 'Forward-Rigth',    // 00101000
    66: 'Backward-Left',    // 01000010
    132: 'Backward-Right'   // 10000100
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
 */
const MotorDriver = function () {
    let _onStatusChange = function () {};
    let motorLatchPin;
    let motorDataPin;
    let motorClockPin;
    let leftFrontPwm;
    let leftRearPwm;
    let rightFrontPwm;
    let rightRearPwm;
    let _currentSpeed = 0;
    let _moveTimer;
    let currentStatus = { direction: REGISTER_TO_DIRECTION[MOVE_REGISTER.STOP], speed: 0 };

    logger.info('Initializing motorDriver...');

    /**
     * Hard delay. Used only to clock or 'cool off' the shift register.
     *
     * @param {number} time - The delay in milisecons.
     */
    const delay = (time = DEFAULT_SHIT_REGISTER_CLOCK_TIME_MS) => {
        let now = Date.now();
        const end = now + time;
        while (now < end) {
            now = Date.now();
        }
    };

    /**
     * Sets the speed of the individual wheel motors.
     *
     * @param {number} leftRear - The speed of the left rear wheel motor.
     * @param {number} leftFront - The speed of the left front wheel motor.
     * @param {number} rightRear - The speed of the right read wheel motor.
     * @param {number} rightFront - The speed of the right front wheel motor.
     */
    const setSpeed = function (leftRear, leftFront, rightRear, rightFront) {
        let defaultSpeed = DEFAULT_SPEED;
        // Do not use arrow function as arguments will not be bound.
        if (arguments.length === 1) {
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
    const setRegister = byte => {
        logger.info(`Set Register to ${byte}`);

        const setupController = function () {
            motorLatchPin.digitalWrite(0);
            delay();
            motorDataPin.digitalWrite(0);
            delay();
        };

        const writeRegister = function (data) {
            motorClockPin.digitalWrite(0);
            delay();
            motorDataPin.digitalWrite(data);
            delay();
            motorClockPin.digitalWrite(1);
            delay();
        };

        setupController();
        writeRegister(byte & BIT[7] ? true : false);
        writeRegister(byte & BIT[6] ? true : false);
        writeRegister(byte & BIT[5] ? true : false);
        writeRegister(byte & BIT[4] ? true : false);
        writeRegister(byte & BIT[3] ? true : false);
        writeRegister(byte & BIT[2] ? true : false);
        writeRegister(byte & BIT[1] ? true : false);
        writeRegister(byte & BIT[0] ? true : false);
        motorLatchPin.digitalWrite(1);
        delay();

    };

    /**
     * Configures the motor driver controller and sets the motors to a stop.
     *
     * @param {object} config - The motor driver configuration object.
     * @param {number} config.leftFrontPwm - The GPIO to configure a PWM for the left front wheel motor.
     * @param {number} config.leftRearPwm - The GPIO to configure a PWM for the left rear wheel motor.
     * @param {number} config.rightFrontPwm - The GPIO to configure a PWM for the right front wheel motor.
     * @param {number} config.rightRearPwm - The GPIO to configure a PWM for the right read wheel motor.
     */
    this.initializeController = config => {
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
        setRegister(MOVE_REGISTER.STOP);
    };

    /**
     * Sets the motor diver controller so it moves in the given direction at the given speed.
     *
     * @param {MOVE_REGISTER} direction - The moving direction.
     * @param {number} speed - The moving speed.
     * @param {number} time - The moving time.
     * @param {Function} cbEnd - The callback to be invoked when the given time has elapsed.
     */
    const run = async (direction, speed, time, cbEnd) => {
        speed = speed || _currentSpeed || DEFAULT_SPEED;
        direction = direction || MOVE_REGISTER.FORWARD;
        cbEnd = cbEnd || {};
        if (_moveTimer) {
            clearTimeout(_moveTimer);
            _moveTimer = null;
        }
        logger.info('Runing at speed', speed);
        setSpeed(speed);
        if (time) {
            _moveTimer = setTimeout(async () => {
                setRegister(MOVE_REGISTER.STOP).then(cbEnd);
                currentStatus = { direction: REGISTER_TO_DIRECTION[MOVE_REGISTER.STOP], speed: 0 };
                _onStatusChange(currentStatus);
            }, time);
        }
        currentStatus = { direction: REGISTER_TO_DIRECTION[direction], speed };
        _onStatusChange(currentStatus);
        setRegister(direction);
    };

    /**
     * Sets the motor diver controller so it moves in the forward direction at the given speed.
     *
     * @param {number} speed - The moving speed.
     * @param {number} time - The moving time.
     * @param {Function} cbEnd - The callback to be invoked when the given time has elapsed.
     * @returns {Promise} - A promise that resolved when the motor driver controller setup is completed.
     */
    this.moveForward = (speed, time, cbEnd) => run(MOVE_REGISTER.FORWARD, speed, time, cbEnd);

    /**
     * Sets the motor diver controller so it moves in the backward direction at the given speed.
     *
     * @param {number} speed - The moving speed.
     * @param {number} time - The moving time.
     * @param {Function} cbEnd - The callback to be invoked when the given time has elapsed.
     * @returns {Promise} - A promise that resolved when the motor driver controller setup is completed.
     */
    this.moveBackward = (speed, time, cbEnd) => run(MOVE_REGISTER.BACKWARD, speed, time, cbEnd);

    /**
     * Sets the motor diver controller so it moves to the left at the given speed.
     *
     * @param {number} speed - The moving speed.
     * @param {number} time - The moving time.
     * @param {Function} cbEnd - The callback to be invoked when the given time has elapsed.
     * @returns {Promise} - A promise that resolved when the motor driver controller setup is completed.
     */
    this.moveLeft = (speed, time, cbEnd) => run(MOVE_REGISTER.LEFT, speed, time, cbEnd);

    /**
     * Sets the motor diver controller so it moves to the right at the given speed.
     *
     * @param {number} speed - The moving speed.
     * @param {number} time - The moving time.
     * @param {Function} cbEnd - The callback to be invoked when the given time has elapsed.
     * @returns {Promise} - A promise that resolved when the motor driver controller setup is completed.
     */
    this.moveRight = (speed, time, cbEnd) => run(MOVE_REGISTER.RIGHT, speed, time, cbEnd);

    /**
     * Sets the motor driver controller so it stops all motors.
     */
    this.stopAllMotors = () => {
        if (_moveTimer) {
            clearTimeout(_moveTimer);
            _moveTimer = null;
        }
        currentStatus = { direction: REGISTER_TO_DIRECTION[MOVE_REGISTER.STOP], speed: 0 };
        _onStatusChange(currentStatus);
        setRegister(MOVE_REGISTER.STOP);
    };

    /**
     * Returns the minimum speed.
     *
     * @returns {number} - The minimum speed.
     */
    this.getMinimumSpeed = () => MINIMUM_SPEED;

    /**
     * Returns the maximum speed.
     *
     * @returns {number} - The maximum speed.
     */
    this.getMaximunSpeed = () => MAXIMUM_SPEED;

    /**
     * Sets the listener for motor driver status changes.
     *
     * @param {Function} onStatusChange - The listener to invoke everytime the motor driver status changes.
     */
    this.setOnStatusChange = onStatusChange => {
        if (typeof onStatusChange !== 'function') {
            logger.error('OnStatusChange listerner is not a function');
            return;
        }
        _onStatusChange = onStatusChange;
    };

    /**
     * Gets the current status of the motor driver.
     *
     * @returns {object} - The motor driver current status object.
     */
    this.getStatus = () => currentStatus;

    // Motor driver initialization completed.
    logger.info('Initialized motorDriver');
};

module.exports = MotorDriver;
module.exports.RUN_MODE = MOVE_REGISTER;
