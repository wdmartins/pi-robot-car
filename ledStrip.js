/* eslint-disable no-bitwise */
'use strict';

const ws281x = require('rpi-ws281x-native');
const GpioDef = require('./rpiGpioDef');
const bunyan = require('bunyan');

const DEFAULT_NUMBER_OF_LEDS = 16;
const DEFAULT_DMA = 10;
const DEFAULT_GPIO = GpioDef.BCM.GPIO1;

/**
 * Instantiates a LED strip wrapper object.
 *
 * @param {object} log - The logger object.
 * @param {number} numberOfLeds - The number of leds.
 * @param {number} dma - The DMA number.
 * @param {number} gpio - The GPIO pin number.
 */
const LedStrip = function (log, numberOfLeds, dma, gpio) {
    const _that = this;
    const logger = log || bunyan.createLogger({
        name: 'motorDriver',
        stream: process.stdout
    });
    logger.info('[LedStrip] Initializing...');

    numberOfLeds = numberOfLeds || DEFAULT_NUMBER_OF_LEDS;
    const pixels = new Uint32Array(numberOfLeds);

    // Initialize the LED strip controller.
    ws281x.init(numberOfLeds, {
        gpioPin: gpio || DEFAULT_GPIO,
        dmaNum: dma || DEFAULT_DMA
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
    logger.info('[LedStrip] Initialized');
};

module.exports = LedStrip;
