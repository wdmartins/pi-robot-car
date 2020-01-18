'use strict';

const Gpio = require('pigpio').Gpio;
const GpioDef = require('./rpiGpioDef');

const DEFAULT_GPIO = GpioDef.BCM.GPIO26;
const STATUS_OFF = 0;
const STATUS_ON = 1;

let Beeper = function(log, gpio) {
    const _that = this;
    const logger = log ||  bunyan.createLogger({
        name: 'beeper',
        stream: process.stdout
    });
    logger.info('[Beeper] Initializing...');

    const beep = new Gpio(gpio || DEFAULT_GPIO, {mode: Gpio.OUTPUT});
    let beepLenghtTimer = null;
    let beepPeriodTimer = null;

    let clearTimers = () => {
        if (beepPeriodTimer) {
            clearInterval(beepPeriodTimer);
            beepPeriodTimer = null;
        }
        if (beepLenghtTimer) {
            clearTimeout(beepLenghtTimer);
            beepLenghtTimer = null;
        }
    };

    this.beepOn = () => {
        clearTimers();
        beep.digitalWrite(STATUS_ON);
    };

    this.beepOff = () => {
        clearTimers();
        beep.digitalWrite(STATUS_OFF);
    };

    this.beep = (time, interval) => {
        let beepTime =  () => {
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
}

module.exports = Beeper;

