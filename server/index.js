'use strict';

const logger = require('./logger').logger('MAIN');
const Server = require('./server');

let server;

const clearOnClose = () => {
    if (!server) {
        require('pigpio').terminate();
        return;
    }
    server.clearOnClose();
};

(() => {
    try {
        logger.info('Initializing application...');
        server = new Server();
        server.initialize();
        logger.info('Initialization completed');
    } catch (e) {
        logger.error(`bot failed ${e.message}`);
        logger.error(e.stack);
        clearOnClose();
    }
})();

process.on('SIGINT', clearOnClose);
