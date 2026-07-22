const path = require('path');

exports.config = {
    runner: 'local',
    port: 4723,
    specs: [
        '../tests/**/*.spec.js'
    ],
    exclude: [],
    maxInstances: 1,
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'Android Emulator',
        'appium:automationName': 'UiAutomator2',
        'appium:app': path.join(process.cwd(), '../app/build/outputs/apk/debug/app-debug.apk'), // Update path depending on build
        'appium:appWaitActivity': '*',
        'appium:noReset': false,
        'appium:fullReset': true,
    }],
    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://localhost',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: ['appium'],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
};
