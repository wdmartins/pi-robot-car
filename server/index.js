'use strict';

const logger = require('./logger').logger('MAIN');
const { CarRobot, resetGpio } = require('./carRobot');
const Server = require('./server');

let carRobot;

(async () => {
    try {
        logger.info('Initializing application...');
        resetGpio();
        carRobot = new CarRobot();
        const server = new Server();
        server.initialize(carRobot);
        await carRobot.test();
        logger.info('Initialization completed');
    } catch (e) {
        logger.error(`bot failed ${e.message}`);
        logger.error(e.stack);
        carRobot.clearOnClose();
    }
})();

process.on('SIGINT', carRobot.clearOnClose);
