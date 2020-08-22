/* eslint-disable no-bitwise */
'use strict';

const { Gpio } = require('pigpio');
const logger = require('./logger').logger('LINE_TRCK');
const GpioDef = require('./rpiGpioDef');


const DEFAULT_LEFT_SENSOR = GpioDef.BCM.GPIO0;
const DEFAULT_CENTER_SENSOR = GpioDef.BCM.GPIO2;
const DEFAULT_RIGHT_SENSOR = GpioDef.BCM.GPIO3;
const DEFAULT_LINE_TRACKING_INTERVAL = 5; // miliseconds

const DEVIATION = {
    UNKNOWN: 'Unknown',
    NONE: 'None',
    LEFT: 'Left',
    RIGHT: 'Right'
};

/**
 * Instanstiates a LineTracker object.
 *
 * @param {object} config - The line tracker configuration object.
 * @param {number} [config.leftSensor=DEFAULT_LEFT_SENSOR] - The GPIO pin number for the left sensor.
 * @param {number} [config.centerSensor=DEFAULT_CENTER_SENSOR] - The GPIO pin number for the center sensor.
 * @param {number} [config.rightSensor=DEFAULT_RIGHT_SENSOR] - The GPIO pin number for the right sensor.
 * @param {number} [config.interval=DEFAULT_LINE_TRACKING_INTERVAL] - The line tracking interval in miliseconds.
 */
const LineTracker = function (config) {
    config = config || {};
    const _that = this;
    let _onStatusChange = function () {};
    let _trackingInterval;
    let _previousDeviation;

    logger.info('Initializing line tracker...');

    const _leftSensor = new Gpio(config.leftSensor || DEFAULT_LEFT_SENSOR, { mode: Gpio.INPUT });
    const _centerSensor = new Gpio(config.centerSensor || DEFAULT_CENTER_SENSOR, { mode: Gpio.INPUT });
    const _rightSensor = new Gpio(config.rightSensor || DEFAULT_RIGHT_SENSOR, { mode: Gpio.INPUT });

    /**
     * Gets the sensor values.
     *
     * @returns {object} - The sensor values.
     */
    this.getSensorValues = () => ({
        left: _leftSensor.digitalRead(),
        center: _centerSensor.digitalRead(),
        right: _rightSensor.digitalRead()
    });

    /**
     * Gets the deviation from the tracked line.
     *
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

    this.startLineTracking = interval => {
        interval = interval || config.interval || DEFAULT_LINE_TRACKING_INTERVAL;
        _trackingInterval = setInterval(() => {
            const forceStatusChange = !_previousDeviation;
            const currentDeviation = _that.getDeviation();
            if (forceStatusChange || currentDeviation !== _previousDeviation) {
                _onStatusChange(currentDeviation);
            }
            _previousDeviation = currentDeviation;
        }, interval);
    };

    this.stopLineTracking = () => {
        if (_trackingInterval) {
            clearInterval(_trackingInterval);
            _trackingInterval = null;
        }
        _previousDeviation = null;
    };

    /**
     * Sets the listener for the line tracker status changes.
     *
     * @param {Function} onStatusChange - The listener to invoke everytime the line tracker status changes.
     */
    this.setOnStatusChange = onStatusChange => {
        if (typeof onStatusChange !== 'function') {
            logger.error('OnStatusChange listerner is not a function');
            return;
        }
        _onStatusChange = onStatusChange;
    };

    logger.info('Initialized line tracker');
};

module.exports = {
    LineTracker,
    DEVIATION
};

