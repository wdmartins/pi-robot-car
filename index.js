'use strict';

const bunyan = require('bunyan');
const piGpio = require('pigpio');
const MotorDriver = require('./motorDriver');
const RUN_MODE = MotorDriver.RUN_MODE;
const LedStrip = require('./ledStrip');
const Beeper = require('./beeper');
const EchoSensor = require('./echoSensor');
const ServoCam = require('./servoCam');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const PORT = process.env.PORT || 3128;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        logger.debug(`[WSS]: Received: ${message}`);
    });
});

// Configure logger
const logger = bunyan.createLogger({
    name: 'robot',
    stream: process.stdout
});

// Initialize Gpio and Controllers
piGpio.initialize();
const ledStrip = new LedStrip(logger);
const beeper = new Beeper(logger);
const echoSensor = new EchoSensor(logger);
const servoCam = new ServoCam(logger);
const motorDriver = new MotorDriver(logger);

let testInterval;

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
            servoCam.move(pulseWidth, pulseWidth);
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
        //await bot.test();
        logger.info('[ROBOT] Initialize server...');
        app.listen(PORT, function() {
            console.log(`App running on localhost:${PORT}`);
        });
        
        app.get('/', function (req, res) {
            console.log('GET to /');
            res.sendFile(path.join(`${__dirname}/index.html`));
        });
        app.get('/client.js', function (req, res) {
            console.log('GET to /');
            res.sendFile(path.join(`${__dirname}/client.js`));
        });
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