'use strict';

const bunyan = require('bunyan');
const piGpio = require('pigpio');
const GpioDef = require('./rpiGpioDef');
const MotorDriver = require('./motorDriver');
const RUN_MODE = MotorDriver.RUN_MODE;
const LedStrip = require('./ledStrip');
const Beeper = require('./beeper');
const EchoSensor = require('./echoSensor');

// Configure logger
const logger = bunyan.createLogger({
    name: 'robot',
    stream: process.stdout
});

// Initialize Gpio
const Gpio = piGpio.Gpio;
piGpio.initialize();

// Configure LED strip
const ledStrip = new LedStrip(logger);

// Bepper
const beeper = new Beeper(logger);

// Echo Sensor
const echoSensor = new EchoSensor(logger);

// Servos
const GPIO_CAM_H_SERVO = GpioDef.BCM.GPIO7; // GpioDef.WPI.GPIO4;
const GPIO_CAM_V_SERVO = GpioDef.BCM.GPIO6; // GpioDef.WPI.GPIO25;
const hCamServo = new Gpio(GPIO_CAM_H_SERVO, {mode: Gpio.OUTPUT});
const vCamServo = new Gpio(GPIO_CAM_V_SERVO, {mode: Gpio.OUTPUT});
let testInterval;

// DC Motors
const motorDriver = new MotorDriver(Gpio, logger);

const Bot = function() {
    this.test = async function () {
        logger.info('[ROBOT] Starting hardware test...');
        ledStrip.render(255,255,255);
        beeper.beep(100, 500);
        let pulseWidth = 1000;
        let increment = 100;
        await motorDriver.initializeController();
        logger.info(`[ROBOT] Echo Sensor reporting ${echoSensor.getDistanceCm()}`);
        testInterval = setInterval(() => {
            logger.info(`[ROBOT] Testing servo motors with pulseWidth ${pulseWidth}`);
            hCamServo.servoWrite(pulseWidth);
            vCamServo.servoWrite(pulseWidth);
            pulseWidth += increment;
            if (pulseWidth >= 2000) {
              increment = -100;
            } else if (pulseWidth <= 1000) {
              increment = 100;
            }
        }, 100);
        setTimeout(async () => {
            ledStrip.render(0, 0, 0);
            beeper.beepOff();
            await motorDriver.stopAllMotors();
            logger.info('[ROBOT] End hardware test.');
            clearInterval(testInterval);
            logger.info(`[ROBOT] Echo Sensor reporting ${echoSensor.getDistanceCm()}`);
        }, 2000);
        return;
    }
};

logger.debug('[ROBOT] Initializing robot...');
(async () => {
    try {
        logger.info('[ROBOT] Initializing robot...');
        const bot = new Bot();
        await bot.test();
    } catch (e) {
        clearOnClose();
        logger.error(`[ROBOT] bot failed ${e.message}`);
        logger.error(e.stack);
        process.exit(1);
    }
})();

let clearOnClose = async function() {
    beeper.beepOff();
    ledStrip.render(0, 0, 0);
    await motorDriver.stopAllMotors();
    piGpio.terminate();
    process.exit(1);
}
process.on('SIGINT', clearOnClose);