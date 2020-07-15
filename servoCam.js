'use strict';

const bunyan = require('bunyan');
const { Gpio } = require('pigpio');
const GpioDef = require('./rpiGpioDef');


const DEFAULT_GPIO_CAM_H_SERVO = GpioDef.BCM.GPIO7; // GpioDef.WPI.GPIO4;
const DEFAULT_GPIO_CAM_V_SERVO = GpioDef.BCM.GPIO6; // GpioDef.WPI.GPIO25;

const ServoCam = function (log, hServoGpio, vServoGpio) {
    const logger = log || bunyan.createLogger({
        name: 'servoCam',
        stream: process.stdout
    });
    logger.info('[ServoCam] Initializing...');

    const hCamServo = new Gpio(hServoGpio || DEFAULT_GPIO_CAM_H_SERVO, { mode: Gpio.OUTPUT });
    const vCamServo = new Gpio(vServoGpio || DEFAULT_GPIO_CAM_V_SERVO, { mode: Gpio.OUTPUT });

    this.move = (horizontal, vertical) => {
        hCamServo.servoWrite(horizontal);
        vCamServo.servoWrite(vertical);
    };

    logger.info('[ServoCam] Initialized');
};

module.exports = ServoCam;
