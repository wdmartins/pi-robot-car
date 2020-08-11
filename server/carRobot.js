'use strict';

const logger = require('./logger').logger('CAR-ROBOT');
const piGpio = require('pigpio');
const MotorDriver = require('./motorDriver');
const { LedStrip } = require('./ledStrip');
const Beeper = require('./beeper');
const EchoSensor = require('./echoSensor');
const ServoCam = require('./servoCam');
const { LineTracker } = require('./lineTracker');
const { STATUS_KEYS } = require('../common/common');
const SPEED_STEP = 20;

const resetGpio = function () {
    try {
        piGpio.terminate();
    } catch (error) {
        logger.info('Gpio could not be reset. It may not have been initialized yet');
    }
};

/**
 * Instanstiates a CarRobot object.
 */
const CarRobot = function () {
    logger.info('Initializing carRobot...');
    resetGpio();

    let _onStatusChange = function () {};
    const _currentStatus = {};

    // Initialize Gpio and Controllers
    piGpio.initialize();

    // Initialize hardware
    const ledStrip = new LedStrip();
    const beeper = new Beeper();
    const echoSensor = new EchoSensor();
    const servoCam = new ServoCam();
    const motorDriver = new MotorDriver();
    const lineTracker = new LineTracker();

    let currentSpeed = 100;

    const test = async function () {
        logger.info('Starting hardware test...');
        ledStrip.render(255, 255, 255);
        beeper.beep(500, 100);
        await motorDriver.initializeController();
        logger.info(`Echo Sensor reporting ${echoSensor.getDistanceCm()}`);
        logger.info('Line tracker sensor values ', lineTracker.getSensorValues());
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

    this.speedUp = function () {
        currentSpeed = Math.min(currentSpeed += SPEED_STEP, motorDriver.getMaximunSpeed());
        logger.info(`Current speed set to ${currentSpeed}`);
        _currentStatus[STATUS_KEYS.CAR_MOVEMENT][STATUS_KEYS.CAR_SET_SPEED] = currentSpeed;
        _onStatusChange(_currentStatus);
    };

    this.speedDown = function () {
        currentSpeed = Math.max(currentSpeed -= SPEED_STEP, motorDriver.getMinimumSpeed());
        logger.info(`Current speed set to ${currentSpeed}`);
        _currentStatus[STATUS_KEYS.CAR_MOVEMENT][STATUS_KEYS.CAR_SET_SPEED] = currentSpeed;
        _onStatusChange(_currentStatus);
    };

    this.honk = function () {
        beeper.beep(1500, 500);
    };

    const buildStatus = () => {
        _currentStatus[STATUS_KEYS.BEEPER_STATUS] = beeper.getStatus();
        _currentStatus[STATUS_KEYS.LED_STATUS] = ledStrip.getStatus();
        _currentStatus[STATUS_KEYS.ECHO_STATUS] = echoSensor.getDistanceCm();
        _currentStatus[STATUS_KEYS.CAMERA_STATUS] = servoCam.getStatus();
        _currentStatus[STATUS_KEYS.CAR_DEVIATION] = lineTracker.getDeviation();
        _currentStatus[STATUS_KEYS.CAR_MOVEMENT] = motorDriver.getStatus();
        _currentStatus[STATUS_KEYS.CAR_MOVEMENT][STATUS_KEYS.CAR_SET_SPEED] = currentSpeed;
    };

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

    this.setOnStatusChange = onStatusChange => {
        if (typeof onStatusChange !== 'function') {
            logger.error('OnStatusChange listerner is not a function');
            return;
        }
        _onStatusChange = onStatusChange;
    };

    this.onBeeperStatusChange = beeperStatus => {
        logger.info('Bepper status has changed to: ', beeperStatus);
        _currentStatus[STATUS_KEYS.BEEPER_STATUS] = beeperStatus;
        _onStatusChange(_currentStatus);
    };

    this.onLedStripStatusChange = ledStripStatus => {
        logger.info('LedStrip status has changed to: ', ledStripStatus);
        _currentStatus[STATUS_KEYS.LED_STATUS] = ledStripStatus;
        _onStatusChange(_currentStatus);
    };

    this.onEchoSensorStatusChange = echoSensorStatus => {
        logger.info('EchoSensor status has changed to: ', echoSensorStatus);
        _currentStatus[STATUS_KEYS.ECHO_STATUS] = echoSensorStatus;
        _onStatusChange(_currentStatus);
    };

    this.onLineTrackerStatusChange = deviation => {
        logger.info('LineTracker status has changed deviation to: ', deviation);
        _currentStatus[STATUS_KEYS.CAR_DEVIATION] = deviation;
        _onStatusChange(_currentStatus);
    };

    this.onServoCamStatusChange = servoCamStatus => {
        logger.info('ServoCam status has changed to: ', servoCamStatus);
        _currentStatus[STATUS_KEYS.CAMERA_STATUS] = servoCamStatus;
        _onStatusChange(_currentStatus);
    };

    this.onMotorDriverStatusChange = motorDriverStatus => {
        logger.info('MotorDriver status has changed to: ', motorDriverStatus);
        _currentStatus[STATUS_KEYS.CAR_MOVEMENT] = motorDriverStatus;
        _currentStatus[STATUS_KEYS.CAR_MOVEMENT][STATUS_KEYS.CAR_SET_SPEED] = currentSpeed;
        _onStatusChange(_currentStatus);
    };

    this.getStatus = () => _currentStatus;

    test();

    // Build the current hardware status object.
    buildStatus();

    // Register hardware status changes listeners
    beeper.setOnStatusChange(this.onBeeperStatusChange);
    ledStrip.setOnStatusChange(this.onLedStripStatusChange);
    echoSensor.setOnStatusChange(this.onEchoSensorStatusChange);
    lineTracker.setOnStatusChange(this.onLineTrackerStatusChange);
    servoCam.setOnStatusChange(this.onServoCamStatusChange);
    motorDriver.setOnStatusChange(this.onMotorDriverStatusChange);

    logger.debug('Initialized carRobot');
};

module.exports.CarRobot = CarRobot;
