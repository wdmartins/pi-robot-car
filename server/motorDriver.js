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
    let _motorLatchPin;
    let _motorDataPin;
    let _motorClockPin;
    let _leftFrontPwm;
    let _leftRearPwm;
    let _rightFrontPwm;
    let _rightRearPwm;
    let _currentSpeed = 0;
    let _currentStatus = { direction: REGISTER_TO_DIRECTION[MOVE_REGISTER.STOP], speed: 0 };

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
        _leftRearPwm.pwmWrite(leftRear || defaultSpeed);
        _rightRearPwm.pwmWrite(rightRear || defaultSpeed);
        _leftFrontPwm.pwmWrite(leftFront || defaultSpeed);
        _rightFrontPwm.pwmWrite(rightFront || defaultSpeed);
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
            _motorLatchPin.digitalWrite(0);
            delay();
            _motorDataPin.digitalWrite(0);
            delay();
        };

        const writeRegister = function (data) {
            _motorClockPin.digitalWrite(0);
            delay();
            _motorDataPin.digitalWrite(data);
            delay();
            _motorClockPin.digitalWrite(1);
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
        _motorLatchPin.digitalWrite(1);
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
        _leftFrontPwm = new Gpio(config.leftFrontPwm || DEFAULT_GPIO_PWM_LEFT_FRONT, { mode: Gpio.OUTPUT });
        _leftRearPwm = new Gpio(config.leftRearPwm || DEFAULT_GPIO_PWM_LEFT_REAR, { mode: Gpio.OUTPUT });
        _rightFrontPwm = new Gpio(config.rightFrontPwm || DEFAULT_GPIO_PWM_RIGHT_FRONT, { mode: Gpio.OUTPUT });
        _rightRearPwm = new Gpio(config.rightRearPwm || DEFAULT_GPIO_PWM_RIGHT_REAR, { mode: Gpio.OUTPUT });

        // Initialize shift register to control individual DC Motors
        _motorDataPin = new Gpio(config.dataGpio || DEFAULT_GPIO_MOTOR_DATA, { mode: Gpio.OUTPUT });
        _motorLatchPin = new Gpio(config.latchGpio || DEFAULT_GPIO_MOTOR_LATCH, { mode: Gpio.OUTPUT });
        _motorClockPin = new Gpio(config.clockGpio || DEFAULT_GPIO_MOTOR_CLOCK, { mode: Gpio.OUTPUT });

        setSpeed(0);
        setRegister(MOVE_REGISTER.STOP);
    };

    /**
     * Sets the motor diver controller so it moves in the given direction at the given speed.
     *
     * @param {MOVE_REGISTER} direction - The moving direction.
     * @param {number} speed - The moving speed.
     */
    const run = (direction, speed) => {
        speed = speed || _currentSpeed || DEFAULT_SPEED;
        direction = direction || MOVE_REGISTER.FORWARD;
        logger.info(`Runing at speed ${speed} in the ${REGISTER_TO_DIRECTION[direction]} direction`);
        setSpeed(speed);
        _currentStatus = { direction: REGISTER_TO_DIRECTION[direction], speed };
        _onStatusChange(_currentStatus);
        setRegister(direction);
    };

    /**
     * Sets the motor diver controller so it moves in the forward direction at the given speed.
     *
     * @param {number} speed - The moving speed.
     */
    this.moveForward = speed => {
        run(MOVE_REGISTER.FORWARD, speed);
    };

    /**
     * Sets the motor diver controller so it moves in the backward direction at the given speed.
     *
     * @param {number} speed - The moving speed.
     */
    this.moveBackward = speed => {
        run(MOVE_REGISTER.BACKWARD, speed);
    };

    /**
     * Sets the motor diver controller so it moves to the left at the given speed.
     *
     * @param {number} speed - The moving speed.
     */
    this.moveLeft = speed => {
        run(MOVE_REGISTER.LEFT, speed);
    };

    /**
     * Sets the motor diver controller so it moves to the right at the given speed.
     *
     * @param {number} speed - The moving speed.
     */
    this.moveRight = speed => {
        run(MOVE_REGISTER.RIGHT, speed);
    };

    /**
     * Sets the motor diver controller so it moves in the forward right direction at the given speed.
     *
     * @param {number} speed - The moving speed.
     */
    this.moveForwardRight = speed => {
        run(MOVE_REGISTER.FORWARD_RIGHT, speed);
    };

    /**
     * Sets the motor diver controller so it moves in the forward left direction at the given speed.
     *
     * @param {number} speed - The moving speed.
     */
    this.moveForwardLeft = speed => {
        run(MOVE_REGISTER.FORWARD_LEFT, speed);
    };

    /**
     * Sets the motor diver controller so it moves in the backward right direction at the given speed.
     *
     * @param {number} speed - The moving speed.
     */
    this.moveBackwardRight = speed => {
        run(MOVE_REGISTER.BACKWARD_RIGHT, speed);
    };

    /**
     * Sets the motor diver controller so it moves in the backward left direction at the given speed.
     *
     * @param {number} speed - The moving speed.
     */
    this.moveBackwardLeft = speed => {
        run(MOVE_REGISTER.BACKWARD_LEFT, speed);
    };

    /**
     * Sets the motor driver controller so it stops all motors.
     */
    this.stopAllMotors = () => {
        _currentStatus = { direction: REGISTER_TO_DIRECTION[MOVE_REGISTER.STOP], speed: 0 };
        _onStatusChange(_currentStatus);
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
    this.getStatus = () => _currentStatus;

    // Motor driver initialization completed.
    logger.info('Initialized motorDriver');
};

module.exports = MotorDriver;
module.exports.RUN_MODE = MOVE_REGISTER;
