// config/wdio.conf.js
exports.config = {
    runner: 'local',
    port: 4723,
    path: '/',
    specs: [
        '../tests/**/*.js'
    ],
    maxInstances: 1,
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'Android Emulator',
        'appium:platformVersion': '13.0',
        'appium:automationName': 'UiAutomator2',
        'appium:app': path.join(__dirname, '../../VitaScan/android/app/build/outputs/apk/debug/app-debug.apk'),
        'appium:appPackage': 'com.vitascan.app',
        'appium:appActivity': '.MainActivity',
        'appium:noReset': false,
        'appium:newCommandTimeout': 240
    }],
    logLevel: 'info',
    bail: 0,
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: ['appium'],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
};
