const bunyan = require('bunyan');
const app = require('express')();
const server = require('http').Server(app);
const path = require('path');
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3128;

let Server = function (log, port) {
    let interval = null;
    let pong = 0;
    const logger = log ||  bunyan.createLogger({
        name: 'echo',
        stream: process.stdout
    });
    logger.info('[Server] Instantiating...');
    port = port || PORT;

    this.initialize = function () {
        logger.info('[Server] Initializing...');
        io.on('connection', (ws) => {
            ws.on('command', (message) => {
                logger.info(`[Server]: Received: ${JSON.stringify(message)}`);
            });
            logger.info('[Server]: WS Connected');
            ws.on('PING', (data) => {
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

        io.on('disconnection', () => {
            logger.info('[Server]: WS Disconnected');
        });
        server.listen(port, function() {
            logger.info(`[Server]: App running on localhost:${port}`);
        });
        
        app.get('/', function (req, res) {
            logger.info('[Server]: GET to /');
            res.sendFile(path.join(`${__dirname}/index.html`));
        });
        app.get('/client.js', function (req, res) {
            logger.info('[Server]: GET to /client.js');
            res.sendFile(path.join(`${__dirname}/client.js`));
        });
    };
};

module.exports = Server;