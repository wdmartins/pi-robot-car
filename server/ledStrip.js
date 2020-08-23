/* eslint-disable no-bitwise */
'use strict';

const logger = require('./logger').logger('LED-STRIP');
const ws281x = require('rpi-ws281x-native');
const GpioDef = require('./rpiGpioDef');

//-----------------------------------------------------------------------------
// Constants definitions
//-----------------------------------------------------------------------------
const COLOR_BLUE = 'blue';
const COLOR_GREEN = 'green';
const COLOR_RED = 'red';
const COLOR_WHITE = 'white';
const SUPPORTED_COLORS = [COLOR_BLUE, COLOR_GREEN, COLOR_RED, COLOR_WHITE];

const DEFAULT_NUMBER_OF_LEDS = 16;      // Default number of LEDs on the strip.
const DEFAULT_DMA = 10;                 // Default DMA.
const DEFAULT_GPIO = GpioDef.BCM.GPIO1; // Default GPIO pin number.
const DEFAULT_FLASHING_TIME = 2000;     // Default flashing time in miliseconds.
const DEFAULT_FLASHING_PERIOD = 100;    // Default flashing period in miliseconds.
const DEFAULT_FLASHING_COLOR = COLOR_RED;   // Default flashing color.

/**
 * Instantiates a LED strip wrapper object.
 *
 * @param {object} [config] - The LED strip configuration.
 * @param {number} [config.numberOfLeds=DEFAULT_NUMBER_OF_LEDS] - The number of leds.
 * @param {number} [config.dma=DEFAULT_DMA] - The DMA number.
 * @param {number} [config.gpio=DEFAULT_GPIO] - The GPIO pin number.
 */
const LedStrip = function ({
    numberOfLeds = DEFAULT_NUMBER_OF_LEDS,
    dma = DEFAULT_DMA,
    gpio = DEFAULT_GPIO
} = {}) {
    logger.info('Initializing ledStrip...');

    const _that = this;
    const pixels = new Uint32Array(numberOfLeds);
    let _onStatusChange = function () {};
    let _currentColors = {
        red: 0,
        green: 0,
        blue: 0
    };

    // Initialize the LED strip controller.
    ws281x.init(numberOfLeds, {
        gpioPin: gpio,
        dmaNum: dma
    });

    /**
     * Renders the LED strip color as a mized of red, green and blue intensities.
     *
     * @param {number} red - The intensity of red color.
     * @param {number} green - The intensity of green color.
     * @param {number} blue - The intensity of the blue color.
     */
    this.render = (red, green, blue) => {
        for (let i = 0; i < numberOfLeds; i++) {
            pixels[i] = (red << 16) | (green << 8) | blue;
        }
        ws281x.render(pixels);
        _currentColors = { red, green, blue };
        _onStatusChange(_currentColors);
    };

    /**
     * Renders green color.
     */
    this.green = () => {
        _that.render(255, 0, 0);
    };

    /**
     * Renders blue color.
     */
    this.blue = () => {
        _that.render(0, 0, 255);
    };

    /**
     * Renders red color.
     */
    this.red = () => {
        _that.render(0, 255, 0);
    };

    /**
     * Renders white color.
     */
    this.white = () => {
        _that.render(255, 255, 255);
    };

    /**
     * Turns leds off.
     */
    this.off = () => {
        _that.render(0, 0, 0);
    };

    /**
     * Flashes the LED Strip with the given color, time and interval.
     *
     * @param {string} [color=DEFAULT_FLASHING_COLOR] - The color string, i.e. Red, blue, green or white.
     * @param {number} [flashingTime=DEFAULT_FLASHING_TIME] - The total time to flash the light in miliseconds.
     * @param {number} [flashinInterval=DEFAULT_FLASHING_PERIOD] - The flashing interval in miliseconds.
     */
    this.flash = (color = DEFAULT_FLASHING_COLOR, flashingTime = DEFAULT_FLASHING_TIME, flashinInterval = DEFAULT_FLASHING_PERIOD) => {
        if (!SUPPORTED_COLORS.includes(color)) {
            logger.error(`Not supported color: ${color}`);
            return;
        }
        let isOn = false;
        const interval = setInterval(() => {
            isOn ? _that.off() : _that[color]();
            isOn = !isOn;
        }, flashinInterval);
        setTimeout(() => {
            clearInterval(interval);
            _that.off();
        }, flashingTime);
    };

    /**
     * Returns the current status of the LED strip.
     *
     * @returns {object} - The composition object of colors.
     */
    this.getStatus = () => _currentColors;

    /**
     * Sets the listener for led strip status changes.
     *
     * @param {Function} onStatusChange - The listener to invoke everytime the led strip status changes.
     */
    this.setOnStatusChange = onStatusChange => {
        if (typeof onStatusChange !== 'function') {
            logger.error('OnStatusChange listerner is not a function');
            return;
        }
        _onStatusChange = onStatusChange;
    };

    /**
     * Terminates the LED strip.
     */
    this.terminate = () => {
        _onStatusChange = function () {};
    };

    logger.info('Initialized ledStrip');
};

module.exports = {
    LedStrip,
    COLOR_BLUE,
    COLOR_GREEN,
    COLOR_RED,
    COLOR_WHITE
};

