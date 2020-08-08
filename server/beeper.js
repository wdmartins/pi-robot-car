'use strict';

const { Gpio } = require('pigpio');
const GpioDef = require('./rpiGpioDef');
const logger = require('./logger').logger('BEEPER');

// Default value for the GPIO pin for the beeper.
const DEFAULT_GPIO = GpioDef.BCM.GPIO26;

// Digital value to write to the GPIO pin.
const STATUS_OFF = 0;
const STATUS_ON = 1;

/**
 * Instantiates a wrapper object to control a beeper.
 *
 * @param {number} [gpio=DEFAULT_GPIO] - The GPIO number for the beeper.
 */
const Beeper = function (gpio = DEFAULT_GPIO) {
    const _that = this;
    let _onStatusChange = function () {};
    logger.info('Initializing beeper...');

    const beep = new Gpio(gpio, { mode: Gpio.OUTPUT });
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
     * 
     * @param {boolean} - Clear all timers and intervals if set to true.
     */
    this.beepOn = (stopTimers = true) => {
        stopTimers && clearTimers();
        beep.digitalWrite(STATUS_ON);
        _onStatusChange(STATUS_ON);
    };

    /**
     * Turns the beeper off.
     * 
     * @param {boolean} - Clear all timers and intervals if set to true.
     */
    this.beepOff = (stopTimers = true) => {
        stopTimers && clearTimers();
        beep.digitalWrite(STATUS_OFF);
        _onStatusChange(STATUS_OFF);
    };

    /**
     * Turns the beeper on for the given time at the given interval.
     *
     * @param {number} time - The time to beep in miliseconds.
     * @param {number} interval - If provided the interval to beep in miliseconds.
     */
    this.beep = (time, interval) => {
        if (beepLenghtTimer || beepPeriodTimer) {
            logger.warn('Beep in progress. Ignore new beep');
            return;
        }

        if (!time || (interval && interval >= time)) {
            logger.error(`Invalid parameters: time ${time}, interval ${interval}`);
            return;
        }

        _that.beepOn();
        beepLenghtTimer = setTimeout(() => {
            _that.beepOff();
        }, time);

        if (interval) {
            beepPeriodTimer = setInterval(() => {
                beep.digitalRead() ? _that.beepOff(false) : _that.beepOn(false);
            }, interval);
        }
    };

    /**
     * Returns the on/off status of the beeper.
     *
     * @returns {number} - 1 is the status is on, 0 otherwise.
     */
    this.getStatus = () => {
        return beep.digitalRead() ? STATUS_ON : STATUS_OFF;
    };

    /**
     * Sets the listener for beeper status changes.
     *
     * @param {function} onStatusChange - The listener to invoke everytime the beeper status changes.
     */
    this.setOnStatusChange = (onStatusChange) => {
        if (typeof onStatusChange !== 'function') {
            logger.error('OnStatusChange listerner is not a function');
            return;
        }
        _onStatusChange = onStatusChange;
    }

    // Complete beeper initialization
    logger.info('Initialized beeper');
};

module.exports = Beeper;

