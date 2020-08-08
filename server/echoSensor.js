/* eslint-disable no-bitwise */
'use strict';

const { Gpio } = require('pigpio');
const logger = require('./logger').logger('ECHO');
const GpioDef = require('./rpiGpioDef');

// Default value for the ECHO and the TRIGGER GPIO Pins of the echo sensor.
const DEFAULT_ECHO_GPIO = GpioDef.WPI.GPIO23;
const DEFAULT_TRIGGER_GPIO = GpioDef.WPI.GPIO26;
// Default trigger time
const DEFAULT_TRIGGER_TIME = 10; // microseconds
// Default measurement interval
const DEFAULT_MEASUREMENT_INTERVAL = 100; // miliseconds
// Microseconds it takes sound to travel 1cm at 20 degrees celcius
const MICROSECDONDS_PER_CM = 1e6 / 34321;
// The minimum difference in distance change from previous measurement to trigger onStatusChange.
const DEFAULT_STATUS_CHANGE_TRIGGER = 1; // centimeters

/**
 * Instantiates the echo sensor wrapper object.
 *
 * @param {object} config - The echo sensor configuration object.
 * @param {number} config.trigger - The GPIO pin number for the echo sensor trigger.
 * @param {number} config.echo - The GPIO pin number for the echo receptor.
 */
const EchoSensor = function (config) {
    config = config || {};
    let _onStatusChange = function () {};
    let _changeTrigger = DEFAULT_STATUS_CHANGE_TRIGGER;
    let _previousDistance;
    let _distance = 0;
    let _startTick;

    logger.info('Initializing echoSensor...');

    const _trigger = new Gpio(config.trigger || DEFAULT_TRIGGER_GPIO, { mode: Gpio.OUTPUT });
    const _echo = new Gpio(config.echo || DEFAULT_ECHO_GPIO, { mode: Gpio.INPUT, alert: true });

    _trigger.digitalWrite(0);

    // Register a listener for the 'alert' event.
    _echo.on('alert', (level, tick) => {
        if (level === 1) {
            _startTick = tick;
        } else {
            let forceOnStatusChange = !_previousDistance;
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
    setInterval(() => {
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
     * @param {function} onStatusChange - The listener to invoke everytime the measured distance changes.
     * @param {number} [changeTrigger=DEFAULT_STATUS_CHANGE_TRIGGER] - The minimum difference in distance change (in centimeters) from previous measurement to trigger onStatusChange.
     */
    this.setOnStatusChange = (onStatusChange, changeTrigger = 1) => {
        if (typeof onStatusChange !== 'function') {
            logger.error('OnStatusChange listerner is not a function');
            return;
        }
        _onStatusChange = onStatusChange;
        _changeTrigger = changeTrigger
    }

    // Complete echoSensor initialization
    logger.info('Initialized echoSensor');
};

module.exports = EchoSensor;
