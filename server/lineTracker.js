/* eslint-disable no-bitwise */
'use strict';

const { Gpio } = require('pigpio');
const logger = require('./logger').logger('LINE_TRCK');
const GpioDef = require('./rpiGpioDef');

//-----------------------------------------------------------------------------
// Constants definitions
//-----------------------------------------------------------------------------
const DEFAULT_LEFT_SENSOR = GpioDef.BCM.GPIO0;          // Default GPIO pin for the left IR reflective switch.
const DEFAULT_CENTER_SENSOR = GpioDef.BCM.GPIO2;        // Default GPIO pin for the center IR reflective switch.
const DEFAULT_RIGHT_SENSOR = GpioDef.BCM.GPIO3;         // Default GPIO pin for the right IR reflective switch.
const DEFAULT_LINE_TRACKING_INTERVAL = 5;               // Default interval check in miliseconds.
const DEVIATION = {
    UNKNOWN: 'Unknown',                                 // Deviation is unkown. Line not detected or to wide.
    NONE: 'None',                                       // No deviation.
    LEFT: 'Left',                                       // Deviation to the left of the line.
    RIGHT: 'Right'                                      // Deviation to the right of the line.
};

/**
 * Instanstiates a LineTracker object.
 *
 * @param {object} config - The line tracker configuration object.
 * @param {number} [config.leftSensor=DEFAULT_LEFT_SENSOR] - The GPIO pin number for the left sensor.
 * @param {number} [config.centerSensor=DEFAULT_CENTER_SENSOR] - The GPIO pin number for the center sensor.
 * @param {number} [config.rightSensor=DEFAULT_RIGHT_SENSOR] - The GPIO pin number for the right sensor.
 * @param {number} [config.checkInterval=DEFAULT_LINE_TRACKING_INTERVAL] - The line tracking interval in miliseconds.
 */
const LineTracker = function ({
    leftSensor = DEFAULT_LEFT_SENSOR,
    centerSensor = DEFAULT_CENTER_SENSOR,
    rightSensor = DEFAULT_RIGHT_SENSOR,
    checkInterval = DEFAULT_LINE_TRACKING_INTERVAL
} = {}) {
    const _that = this;
    let _onStatusChange = function () {};
    let _trackingInterval;
    let _previousDeviation;

    logger.info('Initializing line tracker...');

    const _leftSensor = new Gpio(leftSensor, { mode: Gpio.INPUT });
    const _centerSensor = new Gpio(centerSensor, { mode: Gpio.INPUT });
    const _rightSensor = new Gpio(rightSensor, { mode: Gpio.INPUT });

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

    /**
     * Starts tracking a line by checking IR sensors at a given interval.
     *
     * @param {number} interval - The interval to check for deviation in miliseconds.
     */
    this.startLineTracking = interval => {
        interval = interval || checkInterval;
        _trackingInterval = setInterval(() => {
            const forceStatusChange = !_previousDeviation;
            const currentDeviation = _that.getDeviation();
            if (forceStatusChange || currentDeviation !== _previousDeviation) {
                _onStatusChange(currentDeviation);
            }
            _previousDeviation = currentDeviation;
        }, interval);
    };

    /**
     * Stops checking IR sensors.
     */
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

    /**
     * Terminates the line tracker.
     */
    this.terminate = () => {
        _onStatusChange = function () {};
    };

    logger.info('Initialized line tracker');
};

module.exports = {
    LineTracker,
    DEVIATION
};

