// utils/logger.js
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'execution.log');

function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(logFile, formattedMessage);
    console.log(`[${level}] ${message}`);
}

module.exports = {
    info: (msg) => log(msg, 'INFO'),
    warn: (msg) => log(msg, 'WARN'),
    error: (msg) => log(msg, 'ERROR'),
    debug: (msg) => log(msg, 'DEBUG')
};
