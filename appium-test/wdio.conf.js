// wdio.conf.js
exports.config = {
    runner: 'local',
    port: 4723,
    path: '/',
    specs: [
        './specs/**/*.js'
    ],
    exclude: [],
    maxInstances: 1,
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'Android Emulator',
        'appium:platformVersion': '13.0',
        'appium:automationName': 'UiAutomator2',
        'appium:app': '../VitaScan/android-build.apk', // Target Android APK file
        'appium:appPackage': 'com.vitascan.app',
        'appium:appActivity': 'com.vitascan.app.MainActivity',
        'appium:noReset': false,
        'appium:newCommandTimeout': 240
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
    }
};
