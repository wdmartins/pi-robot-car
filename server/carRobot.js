
'use strict';

const logger = require('./logger').logger('CAR-ROBOT');
const piGpio = require('pigpio');
const MotorDriver = require('./motorDriver');
const LedStrip = require('./ledStrip');
const Beeper = require('./beeper');
const EchoSensor = require('./echoSensor');
const ServoCam = require('./servoCam');

const resetGpio = function () {
    try {
        piGpio.terminate();
    } catch (error) {
        logger.info('Gpio could not be reset. It may not have been initialized yet');
    }
};
module.exports.resetGpio = resetGpio;

/**
 * Instanstiates a CarRobot object.
 */
const CarRobot = function () {
    logger.info('Initializing carRobot...');

    // Initialize Gpio and Controllers
    piGpio.initialize();

    // Initialize hardware
    const ledStrip = new LedStrip();
    const beeper = new Beeper();
    const echoSensor = new EchoSensor();
    const servoCam = new ServoCam();
    const motorDriver = new MotorDriver();

    this.moveCamera = async (direction, degress) => {
        if (direction === 'up' || direction === 'down') {
            servoCam.move(degress, 0);
        } else {
            servoCam.move(0, degress);
        }
    };

    this.flashLed = color => {
        ledStrip.flash(color);
    };

    this.test = async function () {
        logger.info('Starting hardware test...');
        ledStrip.render(255, 255, 255);
        beeper.beep(100, 500);
        await motorDriver.initializeController();
        logger.info(`Echo Sensor reporting ${echoSensor.getDistanceCm()}`);
        // motorDriver.moveForward(20, 1000, () => {
        //     motorDriver.moveLeft(20, 1000, () => {
        //         motorDriver.moveRight(20, 1000, () => {
        //             motorDriver.moveBackward(20, 1000, () => {
        //                 motorDriver.stopAllMotors();
        //             });
        //         });
        //     });
        // });
        setTimeout(async () => {
            ledStrip.render(0, 0, 0);
            beeper.beepOff();
            logger.info('End hardware test.');
            logger.info(`Echo Sensor reporting ${echoSensor.getDistanceCm()}`);
        }, 2000);
    };

    /**
     * Set hardware to default status (Beeper, Leds and Motors off).
     */
    this.clearOnClose = async function () {
        beeper.beepOff();
        ledStrip.render(0, 0, 0);
        await motorDriver.stopAllMotors();
        piGpio.terminate();
    };

    logger.debug('Initialized carRobot');
};

module.exports.CarRobot = CarRobot;
