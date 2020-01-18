'user strict';
const usonic = require('mmm-usonic-fixed');
const bunyan = require('bunyan');
const GpioDef = require('./rpiGpioDef');


const DEFAULT_ECHO_GPIO = GpioDef.WPI.GPIO23;
const DEFAULT_TRIGGER_GPIO = GpioDef.WPI.GPIO26;
const DEFAULT_ECHO_TIMEOUT = 750; // microseconds

let EchoSensor = function(log, config) {
    const logger = log ||  bunyan.createLogger({
        name: 'echo',
        stream: process.stdout
    });
    logger.info('[Echo] Initializing...');
    let echoSensor;
    let echoSensorReady = false;

    config = config || {};

    usonic.init((error) => {
        if (error) {
            logger.error(`[Echo] Error initializing usonic module. Error: ${error}`);
        } else {
            echoSensor = usonic.createSensor(config.echo || DEFAULT_ECHO_GPIO, 
                                             config.trigger || DEFAULT_TRIGGER_GPIO, 
                                             config.timeout || DEFAULT_ECHO_TIMEOUT);
            logger.info('[Echo] Initialiazed');
            echoSensorReady = true;
        }
    });
        
    this.isEchoSensorReady = () => {
        return echoSensorReady;
    };

    this.getDistanceCm = () => {
        return echoSensor();
    };
};

module.exports = EchoSensor;