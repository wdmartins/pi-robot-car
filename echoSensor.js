/* eslint-disable no-bitwise */
'use strict';

const { Gpio } = require('pigpio');
const bunyan = require('bunyan');
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

/**
 * Instantiates the echo sensor wrapper object.
 *
 * @param {object} log - The logger object.
 * @param {object} config - The echo sensor configuration object.
 * @param {number} config.trigger - The GPIO pin number for the echo sensor trigger.
 * @param {number} config.echo - The GPIO pin number for the echo receptor.
 */
const EchoSensor = function (log, config) {
    config = config || {};
    const logger = log || bunyan.createLogger({
        name: 'echo',
        stream: process.stdout
    });

    logger.info('[Echo] Initializing...');

    const trigger = new Gpio(config.trigger || DEFAULT_TRIGGER_GPIO, { mode: Gpio.OUTPUT });
    const echo = new Gpio(config.echo || DEFAULT_ECHO_GPIO, { mode: Gpio.INPUT, alert: true });

    trigger.digitalWrite(0);

    let distance = 0;
    let startTick;

    // Register a listener for the 'alert' event.
    echo.on('alert', (level, tick) => {
        if (level === 1) {
            startTick = tick;
        } else {
            const endTick = tick;
            const diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic
            distance = diff / 2 / MICROSECDONDS_PER_CM;
        }
    });

    // Start a measurement interval
    setInterval(() => {
        trigger.trigger(DEFAULT_TRIGGER_TIME, 1);
    }, DEFAULT_MEASUREMENT_INTERVAL);

    /**
     * Returns the last distance measurement.
     *
     * @returns {number} - The measured distance in centimeters.
     */
    this.getDistanceCm = () => distance;
};

module.exports = EchoSensor;
