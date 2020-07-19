'use strict';
const bunyan = require('bunyan');

module.exports.logger = function (name) {
    return bunyan.createLogger({
        name: name.padEnd(10, '.'),
        stream: process.stdout
    });
};
