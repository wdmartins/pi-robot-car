'use strict';

const logger = require('./logger').logger('MAIN');
const { CarRobot, resetGpio } = require('./carRobot');
const Server = require('./server');

let carRobot;

(async () => {
    try {
        resetGpio();
        logger.info('Initializing car robot...');
        carRobot = new CarRobot();
        logger.info('Initializing server...');
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
