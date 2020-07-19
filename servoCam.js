'use strict';

const logger = require('./logger').logger('SERVO-CAM');
const { Gpio } = require('pigpio');
const GpioDef = require('./rpiGpioDef');

// Defalt values for the servo motors GPIO pins.
const DEFAULT_GPIO_CAM_H_SERVO = GpioDef.BCM.GPIO7; // GpioDef.WPI.GPIO4;
const DEFAULT_GPIO_CAM_V_SERVO = GpioDef.BCM.GPIO6; // GpioDef.WPI.GPIO25;
const DEFAULT_HORIZONTAL_CENTER = 1500;
const DEFAULT_VERTICAL_CENTER = 1500;
const MIN_SERVO_WRITE_VALUE = 500;
const MAX_SERVO_WRITE_VALUE = 2500;

// Instantiates a servo camera motors object.
const ServoCam = function (hServoGpio, vServoGpio) {
    let currentHPos;
    let currentVPos;
    logger.info('Initializing...');
    const _that = this;
    const vCamServo = new Gpio(hServoGpio || DEFAULT_GPIO_CAM_H_SERVO, { mode: Gpio.OUTPUT });
    const hCamServo = new Gpio(vServoGpio || DEFAULT_GPIO_CAM_V_SERVO, { mode: Gpio.OUTPUT });

    function setPosition() {
        logger.info(`Setting servoCam position to H ${currentHPos}, V ${currentVPos}`);
        hCamServo.servoWrite(currentHPos);
        vCamServo.servoWrite(currentVPos);
    }

    /**
     * Moves the camera to the given values.
     *
     * @param {number} horizontal - Degrees to move the camera horizontally.
     * @param {number} vertical - Degrees to move the camera vertically.
     */
    this.move = (horizontal, vertical) => {
        const newHPos = currentHPos + horizontal;
        const newVPos = currentVPos + vertical;
        currentHPos = Math.min(Math.max(newHPos, MIN_SERVO_WRITE_VALUE), MAX_SERVO_WRITE_VALUE);
        currentVPos = Math.min(Math.max(newVPos, MIN_SERVO_WRITE_VALUE), MAX_SERVO_WRITE_VALUE);
        setPosition();
    };

    this.absolutePosition = (horizontal, vertical) => {
        currentHPos = Math.min(Math.max(horizontal, MIN_SERVO_WRITE_VALUE), MAX_SERVO_WRITE_VALUE);
        currentVPos = Math.min(Math.max(vertical, MIN_SERVO_WRITE_VALUE), MAX_SERVO_WRITE_VALUE);
        setPosition();
    };

    _that.absolutePosition(DEFAULT_HORIZONTAL_CENTER, DEFAULT_VERTICAL_CENTER);

    logger.info('Initialized');
};

module.exports = ServoCam;
