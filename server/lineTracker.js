/* eslint-disable no-bitwise */
'use strict';

const { Gpio } = require('pigpio');
const logger = require('./logger').logger('LINE_TRCK');
const GpioDef = require('./rpiGpioDef');


const DEFAULT_LEFT_SENSOR = GpioDef.BCM.GPIO0;
const DEFAULT_CENTER_SENSOR = GpioDef.BCM.GPIO2;
const DEFAULT_RIGHT_SENSOR = GpioDef.BCM.GPIO3;

const DEVIATION = {
    UNKNOWN: 'unknown',
    NONE: 'none',
    LEFT: 'left',
    RIGHT: 'right',
};

/**
 * Instanstiates a LineTracker object.
 * 
 * @param {object} config - The line tracker configuration object.
 * @param {number} config.leftSensor - The GPIO pin number for the left sensor.
 * @param {number} config.centerSensor - The GPIO pin number for the center sensor.
 * @param {number} config.rightSensor - The GPIO pin number for the right sensor.
 */
const LineTracker = function(config) {
    config = config || {};
    const _that = this;

    logger.info('Initializing line tracker...');

    const leftSensor = new Gpio( config.leftSensor || DEFAULT_LEFT_SENSOR, {mode: Gpio.INPUT});
    const centerSensor = new Gpio( config.centerSensor || DEFAULT_CENTER_SENSOR, {mode: Gpio.INPUT});
    const rightSensor = new Gpio( config.rightSensor || DEFAULT_RIGHT_SENSOR, {mode: Gpio.INPUT});

    /**
     * Gets the sensor values.
     * @returns {object} - The sensor values.
     */
    this.getSensorValues = () => {
        return {
            left: leftSensor.digitalRead(),
            center: centerSensor.digitalRead(),
            right: rightSensor.digitalRead()
        };
    };

    /**
     * Gets the deviation from the tracked line.
     * @returns {DEVIATION} - The deviation.
     */
    this.getDeviation = () => {
        const sensorValues = _that.getSensorValues();
        if (sensorValues.left === sensorValues.right && sensorValues.left === sensorValues.center) {
            // Either line is too wide or there is no line
            return DEVIATION.UNKNOWN;
        }
        if (!sensorValues.center && (sensorValues.left || sensorValues.right)) {
            return DEVIATION.NONE;
        }
        if (!sensorValues.right) {
            return DEVIATION.LEFT;
        }
        if (!sensorValues.left) {
            return DEVIATION.RIGHT;
        }
        return DEVIATION.UNKNOWN;
    };

    logger.info('Initialized line tracker');
};

module.exports = {
    LineTracker,
    DEVIATION
};

