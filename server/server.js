'use strict';

const logger = require('./logger').logger('SERVER');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { DRIVE_COMMAND, CAMERA_COMMAND, BEEPER_COMMAND, COMMAND_TYPE, FLASH_COMMAND } = require('../common/common.js');
const LedStrip = require('./ledStrip');
const { CarRobot } = require('./carRobot');

const PORT = process.env.PORT || 3128;

const getCommandType = command => {
    if (DRIVE_COMMAND.hasOwnProperty(command.toUpperCase())) {
        return COMMAND_TYPE.DRIVE;
    }
    if (CAMERA_COMMAND.hasOwnProperty(command.toUpperCase())) {
        return COMMAND_TYPE.CAMERA;
    }
    if (FLASH_COMMAND.hasOwnProperty(command.toUpperCase())) {
        return COMMAND_TYPE.FLASH;
    }
    return COMMAND_TYPE.BEEPER;
};

/**
 * Instantiates the backend server object.
 *
 * @param {number} port - The server port.
 */
const Server = function (port) {
    const carbot = new CarRobot();
    let reportingInterval;

    logger.info('Initializing server...');
    port = port || PORT;

    const executeFlashCommand = command => {
        logger.info('Executing flash command', command);
        switch (command) {
            case FLASH_COMMAND.FLASH_GREEN:
                carbot.flashLed(LedStrip.COLOR_GREEN);
                break;
            case FLASH_COMMAND.FLASH_RED:
                carbot.flashLed(LedStrip.COLOR_RED);
                break;
            case FLASH_COMMAND.FLASH_WHITE:
                carbot.flashLed(LedStrip.COLOR_WHITE);
                break;
            default:
                logger.error(`Flash command [${command}] not implemented`);
                break;
        }
    };

    const executeBeeperCommand = command => {
        logger.info('Executing beeper command', command);
        if (command === BEEPER_COMMAND.HONK) {
            carbot.honk();
            return;
        }
        logger.error(`Beeper command [${command}] not implemented`);
    };

    const executeCameraCommand = command => {
        carbot.moveCamera(command);
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
            case DRIVE_COMMAND.FORWARD_LEFT:
                carbot.forwardLeft();
                break;
            case DRIVE_COMMAND.FORWARD_RIGHT:
                carbot.forwardRight();
                break;
            case DRIVE_COMMAND.BACKWARD_LEFT:
                carbot.backwardLeft();
                break;
            case DRIVE_COMMAND.BACKWARD_RIGHT:
                carbot.backwardRight();
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
            case DRIVE_COMMAND.AUTOMATIC:
                carbot.startAvoidanceDrive();
                break;
            case DRIVE_COMMAND.LINE_TRACKING:
                carbot.startLineTrackingDrive();
                break;
            default:
                logger.error(`Drive command [${command}] not implemented`);
                break;
        }
    };

    /**
     * Initializes and starts the backend server.
     */
    this.initialize = function () {
        logger.info('Initializing...');
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
                    case COMMAND_TYPE.FLASH:
                        executeFlashCommand(command.command);
                        break;
                    default:
                        logger.info('Invalid command type: ', commandType);
                        break;
                }
            });
            logger.info('WS Connected');
            ws.emit('STATUS', carbot.getStatus());
            carbot.setOnStatusChange(status => {
                ws.emit('STATUS', status);
            });
        });

        // Register websocket disconnection handler.
        io.on('disconnection', () => {
            logger.info('WS Disconnected');
            if (reportingInterval) {
                clearInterval(reportingInterval);
            }
        });

        // Start listening on configured port.
        server.listen(port, () => {
            logger.info(`App running on localhost:${port}`);
        });

        logger.info('Initialized server');
    };

    /**
     * Cleanup before exiting the application.
     */
    this.clearOnClose = () => {
        carbot.clearOnClose();
        server.close(() => {
            process.exit();
        });
    };
};

module.exports = Server;
