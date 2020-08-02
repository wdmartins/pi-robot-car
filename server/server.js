'use strict';

const logger = require('./logger').logger('SERVER');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { DRIVE_COMMAND, CAMERA_COMMAND, BEEPER_COMMAND, COMMAND_TYPE } = require('../common/common.js');

const PORT = process.env.PORT || 3128;

const getCommandType = (command) => {
    if (DRIVE_COMMAND.hasOwnProperty(command.toUpperCase())) {
        return COMMAND_TYPE.DRIVE;
    }
    if (CAMERA_COMMAND.hasOwnProperty(command.toUpperCase())) {
        return COMMAND_TYPE.CAMERA;
    }
    return COMMAND_TYPE.BEEPER;
};

/**
 * Instantiates the backend server object.
 *
 * @param {number} port - The server port.
 */
const Server = function (port) {
    let carbot;

    logger.info('Initializing server...');
    port = port || PORT;

    const executeBeeperCommand = command => {
        logger.info('Executing beeper command', command);
        if (command === BEEPER_COMMAND.HONK) {
            carbot.honk();
            return;
        }
        logger.info('Beeper Command Not implemented ', command);

    };

    const executeCameraCommand = command => {
        let degress = 0;
        logger.info('Executing camera command ', command);
        switch (command) {
            case CAMERA_COMMAND.UP:
            case CAMERA_COMMAND.RIGHT:
                degress = -100;
                break;
            case CAMERA_COMMAND.DOWN:
            case CAMERA_COMMAND.LEFT:
                degress = +100;
                break;
        }
        carbot.moveCamera(command, degress);
    };

    const executeDriveCommand = command => {
        logger.info('Executing drive command ', command);
        switch (command) {
            case DRIVE_COMMAND.FORWARD:
                carbot.forward();
                break;
            case DRIVE_COMMAND.BACKWARD:
                carbot.backward();
                break;
            case DRIVE_COMMAND.TURN_LEFT:
                carbot.turnLeft();
                break;
            case DRIVE_COMMAND.TURN_RIGHT:
                carbot.turnRight();
                break;
            case DRIVE_COMMAND.STOP:
                carbot.stop();
                break;
            case DRIVE_COMMAND.SPEED_UP:
                carbot.speedUp();
                break;
            case DRIVE_COMMAND.SPEED_DOWN:
                carbot.speedDown();
                break;
        }
    };
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
                logger.info('Received: ', command);
                if (command.confidence < 0.98) {
                    logger.info('No enough confidence to process command');
                    carbot.flashLed('red');
                    return;
                }
                const commandType = getCommandType(command.command);
                logger.info('Get Command Type: ', commandType);
                switch (commandType) {
                    case COMMAND_TYPE.DRIVE:
                        executeDriveCommand(command.command);
                        break;
                    case COMMAND_TYPE.CAMERA:
                        executeCameraCommand(command.command);
                        break;
                    case COMMAND_TYPE.BEEPER:
                        executeBeeperCommand(command.command);
                        break;
                    default:
                        logger.info('Invalid command type: ', commandType);
                        break;
                }
            });
            logger.info('WS Connected');
        });

        // Register websocket disconnection handler.
        io.on('disconnection', () => {
            logger.info('WS Disconnected');
        });

        // Start listening on configured port.
        server.listen(port, () => {
            logger.info(`App running on localhost:${port}`);
        });

        logger.info('Initialized server');
    };
};

module.exports = Server;
