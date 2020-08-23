/* eslint-disable no-bitwise */
'use strict';

const { Gpio } = require('pigpio');
const logger = require('./logger').logger('ECHO');
const GpioDef = require('./rpiGpioDef');

//-----------------------------------------------------------------------------
// Constants definitions
//-----------------------------------------------------------------------------
const DEFAULT_ECHO_GPIO = GpioDef.WPI.GPIO23;    // Default value for the ECHO GPIO pin of the echo sensor.
const DEFAULT_TRIGGER_GPIO = GpioDef.WPI.GPIO26; // Default value for the TRIGGER GPIO pin of the echo sensor.
const DEFAULT_TRIGGER_TIME = 10;                 // Default trigger time in microseconds.
const DEFAULT_MEASUREMENT_INTERVAL = 500;        // Default measurement interval in miliseconds.
const MICROSECDONDS_PER_CM = 1e6 / 34321;        // Microseconds it takes sound to travel 1cm at 20 degrees celcius.
const DEFAULT_STATUS_CHANGE_TRIGGER = 2;         // The distance difference change in centimeters from previous measurement to trigger onStatusChange.

/**
 * Instantiates the echo sensor wrapper object.
 *
 * @param {object} config - The echo sensor configuration object.
 * @param {number} config.trigger - The GPIO pin number for the echo sensor trigger.
 * @param {number} config.echo - The GPIO pin number for the echo receptor.
 */
const EchoSensor = function ({
    trigger = DEFAULT_TRIGGER_GPIO,
    echo = DEFAULT_ECHO_GPIO
} = {}) {
    logger.info('Initializing echoSensor...');

    const _trigger = new Gpio(trigger, { mode: Gpio.OUTPUT });
    const _echo = new Gpio(echo, { mode: Gpio.INPUT, alert: true });

    let _onStatusChange = function () {};
    let _changeTrigger = DEFAULT_STATUS_CHANGE_TRIGGER;
    let _previousDistance;
    let _distance = 0;
    let _startTick;
    let _intervalTimer;

    _trigger.digitalWrite(0);

    // Register a listener for the 'alert' event.
    _echo.on('alert', (level, tick) => {
        if (level === 1) {
            _startTick = tick;
        } else {
            const forceOnStatusChange = !_previousDistance;
            const endTick = tick;
            const diff = (endTick >> 0) - (_startTick >> 0); // Unsigned 32 bit arithmetic
            _distance = (diff / 2 / MICROSECDONDS_PER_CM).toFixed(2);
            if (forceOnStatusChange || Math.abs(_previousDistance - _distance) > _changeTrigger) {
                _onStatusChange(_distance);
            }
            _previousDistance = _distance;
        }
    });

    // Start a measurement interval
    _intervalTimer = setInterval(() => {
        _trigger.trigger(DEFAULT_TRIGGER_TIME, 1);
    }, DEFAULT_MEASUREMENT_INTERVAL);

    /**
     * Returns the last distance measurement.
     *
     * @returns {number} - The measured distance in centimeters.
     */
    this.getDistanceCm = () => _distance;

    /**
     * Sets the listener for echo sensor status changes.
     *
     * @param {Function} onStatusChange - The listener to invoke everytime the measured distance changes.
     * @param {number} [changeTrigger=DEFAULT_STATUS_CHANGE_TRIGGER] - The minimum difference in distance change (in centimeters)
     * from previous measurement to trigger onStatusChange.
     */
    this.setOnStatusChange = (onStatusChange, changeTrigger = DEFAULT_STATUS_CHANGE_TRIGGER) => {
        if (typeof onStatusChange !== 'function') {
            logger.error('OnStatusChange listerner is not a function');
            return;
        }
        _onStatusChange = onStatusChange;
        _changeTrigger = changeTrigger;
    };

    /**
     * Terminates the echo sensor.
     */
    this.terminate = () => {
        _onStatusChange = function () {};
        if (_intervalTimer) {
            clearInterval(_intervalTimer);
            _intervalTimer = null;
        }
    };

    // Complete echoSensor initialization
    logger.info('Initialized echoSensor');
};

module.exports = EchoSensor;
