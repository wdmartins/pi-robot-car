'use strict';

const { Gpio } = require('pigpio');
const GpioDef = require('./rpiGpioDef');
const bunyan = require('bunyan');

// Default value for the GPIO pin for the beeper.
const DEFAULT_GPIO = GpioDef.BCM.GPIO26;

// Digital value to write to the GPIO pin.
const STATUS_OFF = 0;
const STATUS_ON = 1;

/**
 * Wrapper to control a beeper.
 *
 * @param {object} log - The logger object.
 * @param {number} gpio - The GPIO number for the beeper.
 */
const Beeper = function (log, gpio) {
    const _that = this;
    const logger = log || bunyan.createLogger({
        name: 'beeper',
        stream: process.stdout
    });
    logger.info('[Beeper] Initializing...');

    const beep = new Gpio(gpio || DEFAULT_GPIO, { mode: Gpio.OUTPUT });
    let beepLenghtTimer = null;
    let beepPeriodTimer = null;

    /**
     * Clear all timers.
     */
    const clearTimers = () => {
        if (beepPeriodTimer) {
            clearInterval(beepPeriodTimer);
            beepPeriodTimer = null;
        }
        if (beepLenghtTimer) {
            clearTimeout(beepLenghtTimer);
            beepLenghtTimer = null;
        }
    };

    /**
     * Turns the beeper on.
     */
    this.beepOn = () => {
        clearTimers();
        beep.digitalWrite(STATUS_ON);
    };

    /**
     * Turns the beeper off.
     */
    this.beepOff = () => {
        clearTimers();
        beep.digitalWrite(STATUS_OFF);
    };

    /**
     * Turns the beeper on for the given time at the given interval.
     *
     * @param {number} time - The time to beep in miliseconds.
     * @param {number} interval - If provided the interval to beep in miliseconds.
     */
    this.beep = (time, interval) => {
        const beepTime = () => {
            beepLenghtTimer = setTimeout(() => {
                beep.digitalWrite(STATUS_OFF);
            }, time);
        };

        _that.beepOn();
        if (time) {
            beepTime();
        }
        if (interval) {
            beepPeriodTimer = setInterval(() => {
                beep.digitalWrite(STATUS_ON);
                beepTime();
            }, interval);
        }
    };


    logger.info('[Beeper] Initialized');
};

module.exports = Beeper;

