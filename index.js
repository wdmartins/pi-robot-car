'use strict';

const bunyan = require('bunyan');
const ws281x = require('rpi-ws281x-v2');
const Gpio = require('onoff').Gpio;
const Servo = require('pigpio').Gpio;
const usonic = require('mmm-usonic-fixed');
const GpioDef = require('./rpiGpioDef');
const MotorDriver = require('./motorDriver');

// Configure logger
const logger = bunyan.createLogger({
    name: 'robot',
    stream: process.stdout
});

// Gpio status
const STATUS_OFF = 0;
const STATUS_ON = 1;

// Buzzer
const BEEP_GPIO = GpioDef.BCM.GPIO26;
const beep = new Gpio(BEEP_GPIO, 'out');

// Echo
const ECHO_GPIO = GpioDef.WPI.GPIO23;
const TRIGGER_GPIO = GpioDef.WPI.GPIO26;
const DEFAULT_ECHO_TIMEOUT = 750; // microseconds
let echoSensor = null;

usonic.init((error) => {
    if (error) {
        logger.error(`[ROBOT] Error initializing usonic module. Error: ${error}`);
    } else {
        logger.info('[ROBOT] usonic module initialized.');
        echoSensor = usonic.createSensor(ECHO_GPIO, TRIGGER_GPIO, DEFAULT_ECHO_TIMEOUT);
        logger.info(`[ROBOT] Echo sensor reporting ${echoSensor()} cm`);
    }
});

// Configure LED strip
const NUMBER_OF_LEDS = 16;
const DMA = 10;
const LED_STRIP_GPIO = GpioDef.BCM.GPIO1;
ws281x.configure({
    leds: NUMBER_OF_LEDS,
    dma: DMA,
    gpio: LED_STRIP_GPIO
});
const pixels = new Uint32Array(16);
const render = function(red, green, blue) {
    for (let i = 0; i < NUMBER_OF_LEDS; i++) {
        pixels[i] = (red << 16) | (green << 8)| blue;
    }
    ws281x.render(pixels);
};

// Servos
const GPIO_CAM_H_SERVO = GpioDef.WPI.GPIO4;
const GPIO_CAM_V_SERVO = GpioDef.WPI.GPIO25;
const hCamServo = new Servo(GPIO_CAM_H_SERVO, {mode: Servo.OUTPUT});
const vCamServo = new Servo(GPIO_CAM_V_SERVO, {mode: Servo.OUTPUT});
let testInterval;

// DC Motors
const motorDriver = new MotorDriver(logger);
motorDriver.initializeController();

const Bot = function() {
    this.test = async function () {
        logger.info('[ROBOT] Starting hardware test...');
        render(255,255,255);
        beep.writeSync(STATUS_OFF);
        let pulseWidth = 1000;
        let increment = 100;    
        motorDriver.test();    
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
        setTimeout(() => {
            render(0, 0, 0);
            beep.writeSync(STATUS_OFF);
            motorDriver.stopAllMotors();
            logger.info('[ROBOT] End hardware test.');
            clearInterval(testInterval);
        }, 2000);
        return;
    }
};

logger.debug('[ROBOT] Initializing robot...');
(async () => {
    try {
        logger.info('[ROBOT] Initializing robot...');
        const bot = new Bot();
        bot.test();
    } catch (e) {
        clearOnClose();
        logger.error(`[ROBOT] bot failed ${e.message}`);
        logger.error(e.stack);
        process.exit(1);
    }
})();

let clearOnClose = function() {
    beep.writeSync(STATUS.OFF);
    render(0, 0, 0);
}
process.on('SIGINT', clearOnClose);