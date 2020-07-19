'use strict';

const logger = require('./logger').logger('SERVER');
const app = require('express')();
const server = require('http').Server(app);
const path = require('path');
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3128;

/**
 * Instantiates the backend server object.
 *
 * @param {number} port - The server port.
 */
const Server = function (port) {
    let interval = null;
    let pong = 0;
    let carbot;

    logger.info('Instantiating...');
    port = port || PORT;

    /**
     * Initializes and starts the backend server.
     *
     * @param {object} bot - The robot car object.
     */
    this.initialize = function (bot) {
        logger.info('Initializing...');
        carbot = bot;
        // Register websocket connection handler.
        io.on('connection', ws => {
            ws.on('command', command => {
                logger.info(`Received: ${JSON.stringify(command)}`);
                if (command.confidence < 0.98) {
                    logger.info('No enough confidence to process command');
                    return;
                }
                let degress = 0;
                switch (command.command) {
                    case 'up':
                    case 'right':
                        degress = -100;
                        break;
                    case 'down':
                    case 'left':
                        degress = +100;
                        break;
                }
                carbot.moveCamera(command.command, degress);

            });
            logger.info('WS Connected');
            ws.on('PING', data => {
                logger.info(`Received PING ${data.ping}`);
            });
            if (interval) {
                clearInterval(interval);
                interval = null;
                pong = 0;
            }
            interval = setInterval(() => {
                logger.info(`Sending PONG ${pong}`);
                ws.emit('PONG', {
                    pong: pong++
                });
            }, 10000);
        });

        // Register websocket disconnection handler.
        io.on('disconnection', () => {
            logger.info('WS Disconnected');
        });

        //TODO: Let NGINX Handle this.
        app.get('/', (req, res) => {
            logger.info('GET to /');
            res.sendFile(path.join(`${__dirname}/index.html`));
        });

        //TODO: Let NGINX Handle this.
        app.get('/client.js', (req, res) => {
            logger.info('GET to /client.js');
            res.sendFile(path.join(`${__dirname}/client.js`));
        });

        // Start listening on configured port.
        server.listen(port, () => {
            logger.info(`App running on localhost:${port}`);
        });

    };
};

module.exports = Server;
