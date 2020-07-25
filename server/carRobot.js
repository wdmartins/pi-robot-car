
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
    const currentSpeed = 100;

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

    this.stop = async function () {
        await motorDriver.stopAllMotors();
    };

    this.forward = async function () {
        await motorDriver.moveForward(currentSpeed);
    };

    this.backward = async function () {
        await motorDriver.moveBackward(currentSpeed);
    };

    this.turnRight = async function () {
        await motorDriver.moveRight(currentSpeed);
    };

    this.turnLeft = async function () {
        await motorDriver.moveLeft(currentSpeed);
    };

    this.honk = async function () {
        beeper.beep(1500, 500);
    };

    logger.debug('Initialized carRobot');
};

module.exports.CarRobot = CarRobot;