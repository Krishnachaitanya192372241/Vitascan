// utils/screenshot.js
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const screenshotDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
}

async function captureScreenshot(driver, filename) {
    try {
        const screenshotPath = path.join(screenshotDir, `${filename}.png`);
        const screenshotData = await driver.takeScreenshot();
        fs.writeFileSync(screenshotPath, screenshotData, 'base64');
        logger.info(`Screenshot captured successfully: ${screenshotPath}`);
        return screenshotPath;
    } catch (error) {
        logger.error(`Failed to capture screenshot: ${error.message}`);
        return null;
    }
}

module.exports = { captureScreenshot };
