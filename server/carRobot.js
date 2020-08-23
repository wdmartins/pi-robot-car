/* eslint-disable max-lines-per-function */
'use strict';

const logger = require('./logger').logger('CAR-ROBOT');
const piGpio = require('pigpio');
const MotorDriver = require('./motorDriver');
const { LedStrip } = require('./ledStrip');
const Beeper = require('./beeper');
const EchoSensor = require('./echoSensor');
const ServoCam = require('./servoCam');
const { LineTracker, DEVIATION } = require('./lineTracker');
const { STATUS_KEYS, CAMERA_COMMAND } = require('../common/common');

//-----------------------------------------------------------------------------
// Constants definitions
//-----------------------------------------------------------------------------
const DEFAULT_SPEED = 150;                  // Manual driving: speed.
const SPEED_STEP = 10;                      // Manual driving: speed increasing steps.
const AUTO_DRIVING_CHECK_INTERVAL = 100;    // Automatic avoidance driving: obstacle checking interval in miliseconds.
const MINIMUM_AVOIDANCE_DISTANCE = 30;      // Automatic avoidance driving: minimum obstacle distance in centimeters.
const AUTO_DRIVING_CORRECTION_TIME = 500;   // Automatic avoidance driving: trajectory correction (turning) time in miliseconds.
const AUTO_FORWARD_SPEED = 150;             // Automatic avoidance driving: forward driving speed.
const AUTO_TURNING_SPEED = 200;             // Automatic avoidance driving: turning speed.
const AUTO_BACKWARD_SPEED = 120;            // Automatic avoidance driving: backward driving speed.
const LINE_TRACKING_SPEED = 110;            // Line tracking driving: speed.
const LINE_TRACKING_CORRECTION_SPEED = 150; // Line tracking driving: deviation from line correction seepd.
const LINE_TRACKING_MAX_UNKNOWN_TIME = 3000;// Line tracking driving: maximum correction time in miliseconds.
const AVOIDANCE_DRIVING_STATUS = {          // Automatic avoidance driving: driving states.
    STOPPED: 'stopped',
    BACKING_OUT: 'backing_out',
    TURNING: 'turning',
    RUNNING: 'running'
};

// Terminate GPIO
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
    const _currentStatus = {};
    const _that = this;
    let _onStatusChange = function () {};
    let _autoDrivingInterval;
    let _avoidanceDrivingStatus;
    let _lineTrackingDriving = false;
    let _lineTrackingUnknownTimer;

    // Initialize GPIO
    piGpio.initialize();

    // Initialize hardware controllers
    const ledStrip = new LedStrip();
    const beeper = new Beeper();
    const echoSensor = new EchoSensor();
    const servoCam = new ServoCam();
    const motorDriver = new MotorDriver();
    const lineTracker = new LineTracker();

    let currentSpeed = DEFAULT_SPEED;

    const buildStatus = () => {
        _currentStatus[STATUS_KEYS.BEEPER_STATUS] = beeper.getStatus();
        _currentStatus[STATUS_KEYS.LED_STATUS] = ledStrip.getStatus();
        _currentStatus[STATUS_KEYS.ECHO_STATUS] = echoSensor.getDistanceCm();
        _currentStatus[STATUS_KEYS.CAMERA_STATUS] = servoCam.getStatus();
        _currentStatus[STATUS_KEYS.CAR_DEVIATION] = lineTracker.getDeviation();
        _currentStatus[STATUS_KEYS.CAR_MOVEMENT] = motorDriver.getStatus();
        _currentStatus[STATUS_KEYS.CAR_MOVEMENT][STATUS_KEYS.CAR_SET_SPEED] = currentSpeed;
    };

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

    const avoidanceDriving = () => {
        const distance = echoSensor.getDistanceCm();
        logger.info(`Distance to obstacle: ${distance}, status: ${_avoidanceDrivingStatus}`);
        let turningTimer;
        switch (_avoidanceDrivingStatus) {
            case AVOIDANCE_DRIVING_STATUS.RUNNING:
                if (distance < MINIMUM_AVOIDANCE_DISTANCE) {
                    beeper.beep(500);
                    _that.flashLed(LedStrip.COLOR_RED);
                    motorDriver.stopAllMotors();
                    _avoidanceDrivingStatus = AVOIDANCE_DRIVING_STATUS.STOPPED;
                }
                break;
            case AVOIDANCE_DRIVING_STATUS.STOPPED:
                motorDriver.moveBackward(AUTO_BACKWARD_SPEED);
                _avoidanceDrivingStatus = AVOIDANCE_DRIVING_STATUS.BACKING_OUT;
                break;
            case AVOIDANCE_DRIVING_STATUS.BACKING_OUT:
                if (distance > 2 * MINIMUM_AVOIDANCE_DISTANCE) {
                    motorDriver.stopAllMotors();
                    _avoidanceDrivingStatus = AVOIDANCE_DRIVING_STATUS.TURNING;
                }
                break;
            case AVOIDANCE_DRIVING_STATUS.TURNING:
                if (!turningTimer) {
                    motorDriver.moveLeft(AUTO_TURNING_SPEED);
                    turningTimer = setTimeout(() => {
                        turningTimer = null;
                        _avoidanceDrivingStatus = AVOIDANCE_DRIVING_STATUS.RUNNING;
                        motorDriver.moveForward(AUTO_FORWARD_SPEED);
                    }, AUTO_DRIVING_CORRECTION_TIME);
                }
                break;
        }
    };

    /**
     * Terminate hardware controllers.
     */
    this.clearOnClose = () => {
        _onStatusChange = function () {};
        servoCam.terminate();
        echoSensor.terminate();
        beeper.terminate();
        ledStrip.terminate();
        motorDriver.terminate();
        lineTracker.terminate();
        piGpio.terminate();
    };

    /**
     * Stops the car robot.
     */
    this.stop = () => {
        motorDriver.stopAllMotors();
        if (_autoDrivingInterval) {
            _that.stopAvoidanceDrive();
        }
        if (_lineTrackingDriving) {
            _that.stopLineTrackingDrive();
        }
    };

    /**
     * Moves the car robot forward.
     */
    this.forward = function () {
        motorDriver.moveForward(currentSpeed);
    };

    /**
     * Moves the car robot backward.
     */
    this.backward = function () {
        motorDriver.moveBackward(currentSpeed);
    };

    /**
     * Turns the car robot to the right.
     */
    this.turnRight = function () {
        motorDriver.moveRight(currentSpeed);
    };

    /**
     * Turns the car robot to the left.
     */
    this.turnLeft = function () {
        motorDriver.moveLeft(currentSpeed);
    };

    /**
     * Moves the car robot forward while leaning to the left.
     */
    this.forwardLeft = function () {
        motorDriver.moveForwardLeft();
    };

    /**
     * Moves the car robot forward while leaning to the right.
     */
    this.forwardRight = function () {
        motorDriver.moveForwardRight();
    };

    /**
     * Moves the car robot backward while leaning to the left.
     */
    this.backwardLeft = function () {
        motorDriver.moveBackwardLeft();
    };

    /**
     * Moves the car robot backward while leaning to the right.
     */
    this.backwardRight = function () {
        motorDriver.moveBackwardRight();
    };

    /**
     * Increases the car robot speed.
     */
    this.speedUp = function () {
        currentSpeed = Math.min(currentSpeed += SPEED_STEP, motorDriver.getMaximunSpeed());
        logger.info(`Current speed set to ${currentSpeed}`);
        _currentStatus[STATUS_KEYS.CAR_MOVEMENT][STATUS_KEYS.CAR_SET_SPEED] = currentSpeed;
        _onStatusChange(_currentStatus);
    };

    /**
     * Decreases the car robot speed.
     */
    this.speedDown = function () {
        currentSpeed = Math.max(currentSpeed -= SPEED_STEP, motorDriver.getMinimumSpeed());
        logger.info(`Current speed set to ${currentSpeed}`);
        _currentStatus[STATUS_KEYS.CAR_MOVEMENT][STATUS_KEYS.CAR_SET_SPEED] = currentSpeed;
        _onStatusChange(_currentStatus);
    };

    /**
     * Honks the horn (beeper).
     */
    this.honk = function () {
        beeper.beep(1500, 500);
    };

    /**
     * Moves the servo motors to redirect the camera.
     *
     * @param {string} command - The direction to move the camera towards.
     * @param {string} degress - The amount of movement.
     */
    this.moveCamera = async (command, degress = 100) => {
        let hdegress = degress;
        let vdegress = degress;
        switch (command) {
            case CAMERA_COMMAND.UP:
                vdegress = -1 * vdegress;
                hdegress = 0;
                break;
            case CAMERA_COMMAND.RIGHT:
                hdegress = -1 * hdegress;
                vdegress = 0;
                break;
            case CAMERA_COMMAND.DOWN:
                hdegress = 0;
                break;
            case CAMERA_COMMAND.LEFT:
                vdegress = 0;
                break;
            case CAMERA_COMMAND.UP_RIGHT:
                hdegress = -1 * hdegress / 2;
                vdegress = -1 * vdegress / 2;
                break;
            case CAMERA_COMMAND.DOWN_LEFT:
                hdegress = hdegress / 2;
                vdegress = vdegress / 2;
                break;
            case CAMERA_COMMAND.UP_LEFT:
                hdegress = hdegress / 2;
                vdegress = -1 * vdegress / 2;
                break;
            case CAMERA_COMMAND.DOWN_RIGHT:
                hdegress = -1 * hdegress / 2;
                vdegress = vdegress / 2;
                break;
        }
        servoCam.move(vdegress, hdegress);
    };

    /**
     * Flashes the LED strip with the given color.
     *
     * @param {string} color - The flashing color.
     */
    this.flashLed = color => {
        ledStrip.flash(color);
    };

    /**
     * Sets the listener for car robot status changes.
     *
     * @param {Function} onStatusChange - The listener to invoke everytime the car robot status changes.
     */
    this.setOnStatusChange = onStatusChange => {
        if (typeof onStatusChange !== 'function') {
            logger.error('OnStatusChange listerner is not a function');
            return;
        }
        _onStatusChange = onStatusChange;
    };

    /**
     * The listener for changes on the beeper status.
     *
     * @param {number} beeperStatus - The beeper status, 0 is OFF, 1 is ON.
     */
    this.onBeeperStatusChange = beeperStatus => {
        logger.info('Bepper status has changed to: ', beeperStatus);
        _currentStatus[STATUS_KEYS.BEEPER_STATUS] = beeperStatus;
        _onStatusChange(_currentStatus);
    };

    /**
     * The listener for changes on the LED strip status.
     *
     * @param {object} ledStripStatus - The LED strip status.
     * @param {number} ledStripStatus.red - The amount of red (0-255).
     * @param {number} ledStripStatus.blue - The amount of blue (0-255).
     * @param {number} ledStripStatus.green - The amount of green (0-255).
     */
    this.onLedStripStatusChange = ledStripStatus => {
        logger.info('LedStrip status has changed to: ', ledStripStatus);
        _currentStatus[STATUS_KEYS.LED_STATUS] = ledStripStatus;
        _onStatusChange(_currentStatus);
    };

    /**
     * The listener for changes on the echo sensor status.
     *
     * @param {number} echoSensorStatus - The measured distance to an object in centimeters.
     */
    this.onEchoSensorStatusChange = echoSensorStatus => {
        logger.info('EchoSensor status has changed to: ', echoSensorStatus);
        _currentStatus[STATUS_KEYS.ECHO_STATUS] = echoSensorStatus;
        _onStatusChange(_currentStatus);
    };

    /**
     * The listener for changes on the deviation of the line tracker.
     *
     * @param {string} deviation - The new deviation from the line.
     */
    this.onLineTrackerStatusChange = deviation => {
        logger.info('LineTracker status has changed deviation to: ', deviation);
        _currentStatus[STATUS_KEYS.CAR_DEVIATION] = deviation;
        _onStatusChange(_currentStatus);
        if (_lineTrackingDriving) {
            if (deviation !== DEVIATION.UNKNOWN) {
                if (_lineTrackingUnknownTimer) {
                    clearTimeout(_lineTrackingUnknownTimer);
                    _lineTrackingUnknownTimer = null;
                }
            }
            switch (deviation) {
                case DEVIATION.LEFT:
                    motorDriver.moveForwardRight(LINE_TRACKING_CORRECTION_SPEED);
                    break;
                case DEVIATION.RIGHT:
                    motorDriver.moveForwardLeft(LINE_TRACKING_CORRECTION_SPEED);
                    break;
                case DEVIATION.NONE:
                    motorDriver.moveForward(LINE_TRACKING_SPEED);
                    logger.info('No deviation!!');
                    break;
                case DEVIATION.UNKNOWN:
                    if (!_lineTrackingUnknownTimer) {
                        _lineTrackingUnknownTimer = setTimeout(() => {
                            logger.info('Cannot find line to track');
                            beeper.beep(500);
                            _that.flashLed(LedStrip.COLOR_RED);
                            motorDriver.stopAllMotors();
                        }, LINE_TRACKING_MAX_UNKNOWN_TIME);
                    }
                    break;
            }
        }
    };

    /**
     * The listener for changes on the deviation of the camera servos position.
     *
     * @param {object} servoCamStatus - The new servoCam status.
     * @param {number} servoCamStatus.horizontal - The horizontal position of the servo.
     * @param {number} servoCamStatus.vertical - The vertical position of the servo.
     */
    this.onServoCamStatusChange = servoCamStatus => {
        logger.info('ServoCam status has changed to: ', servoCamStatus);
        _currentStatus[STATUS_KEYS.CAMERA_STATUS] = servoCamStatus;
        _onStatusChange(_currentStatus);
    };

    /**
     * The listener for changes in the motor driver.
     *
     * @param {object} motorDriverStatus - The new status of the motor driver.
     * @param {string} motorDriverStatus.direction - The current direction.
     * @param {number} motorDriverStatus.speed - The current speed.
     */
    this.onMotorDriverStatusChange = motorDriverStatus => {
        logger.info('MotorDriver status has changed to: ', motorDriverStatus);
        _currentStatus[STATUS_KEYS.CAR_MOVEMENT] = motorDriverStatus;
        _currentStatus[STATUS_KEYS.CAR_MOVEMENT][STATUS_KEYS.CAR_SET_SPEED] = currentSpeed;
        _onStatusChange(_currentStatus);
    };

    /**
     * Gets the current status of the hardware.
     *
     * @returns {object} - The current status of the car robot.
     */
    this.getStatus = () => _currentStatus;

    /**
     * Starts obstacle avoidance automatic driving.
     */
    this.startAvoidanceDrive = () => {
        _that.stopLineTrackingDrive();
        logger.info('Starting automatic obstacle avoidance driving');
        // beeper.beep(1500, 500);
        _autoDrivingInterval = setInterval(avoidanceDriving, AUTO_DRIVING_CHECK_INTERVAL);
        motorDriver.moveForward(AUTO_FORWARD_SPEED);
        _avoidanceDrivingStatus = AVOIDANCE_DRIVING_STATUS.RUNNING;
    };

    /**
     * Stops obstacle avoidance automatic driving.
     */
    this.stopAvoidanceDrive = () => {
        if (_autoDrivingInterval) {
            logger.info('Stopping automatic obstacle avoidance driving');
            clearInterval(_autoDrivingInterval);
            motorDriver.stopAllMotors();
            _avoidanceDrivingStatus = AVOIDANCE_DRIVING_STATUS.STOPPED;
        }
    };

    /**
     * Starts line tracking automatic driving.
     */
    this.startLineTrackingDrive = () => {
        _that.stopAvoidanceDrive();
        _lineTrackingDriving = true;
        lineTracker.startLineTracking();
    };

    /**
     * Stops line tracking automatic driving.
     */
    this.stopLineTrackingDrive = () => {
        if (_lineTrackingDriving) {
            logger.info('Stopping line tracking driving');
            if (_lineTrackingUnknownTimer) {
                clearTimeout(_lineTrackingUnknownTimer);
                _lineTrackingUnknownTimer = null;
            }
        }
        _lineTrackingDriving = false;
        lineTracker.stopLineTracking();
    };

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

const carRobot = new CarRobot();

const getCarRobotInstance = () => carRobot;
module.exports.getCarRobotInstance = getCarRobotInstance;
