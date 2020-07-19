'use strict';

const bunyan = require('bunyan');
const app = require('express')();
const server = require('http').Server(app);
const path = require('path');
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3128;

/**
 * Instantiates the backend server object.
 *
 * @param {object} log - The logger object.
 * @param {number} port - The server port.
 */
const Server = function (log, port) {
    let carbot = null;
    let interval = null;
    let pong = 0;
    const logger = log || bunyan.createLogger({
        name: 'echo',
        stream: process.stdout
    });
    logger.info('[Server] Instantiating...');
    port = port || PORT;

    /**
     * Initializes and starts the backend server.
     */
    this.initialize = function (bot) {
        logger.info('[Server] Initializing...');
        carbot = bot;
        // Register websocket connection handler.
        io.on('connection', ws => {
            ws.on('command', command => {
                logger.info(`[Server]: Received: ${JSON.stringify(command)}`);
                if (command.confidence < 0.98) {
                    logger.info('[Server]: No enough confidence to process command');
                    return;
                }
                let degress = 0;
                switch (command.command) {
                    case 'up':
                    case 'left':
                        degress = -100;
                        break;
                    case 'down':
                    case 'right':
                        degress = +100;
                        break;
                }
                carbot.moveCamera(command.command, degress);

            });
            logger.info('[Server]: WS Connected');
            ws.on('PING', data => {
                logger.info(`[Server]: Received PING ${data.ping}`);
            });
            if (interval) {
                clearInterval(interval);
                interval = null;
                pong = 0;
            }
            interval = setInterval(() => {
                logger.info(`[Server]: Sending PONG ${pong}`);
                ws.emit('PONG', {
                    pong: pong++
                });
            }, 10000);
        });

        // Register websocket disconnection handler.
        io.on('disconnection', () => {
            logger.info('[Server]: WS Disconnected');
        });

        //TODO: Let NGINX Handle this.
        app.get('/', (req, res) => {
            logger.info('[Server]: GET to /');
            res.sendFile(path.join(`${__dirname}/index.html`));
        });

        //TODO: Let NGINX Handle this.
        app.get('/client.js', (req, res) => {
            logger.info('[Server]: GET to /client.js');
            res.sendFile(path.join(`${__dirname}/client.js`));
        });

        // Start listening on configured port.
        server.listen(port, () => {
            logger.info(`[Server]: App running on localhost:${port}`);
        });

    };
};

module.exports = Server;
