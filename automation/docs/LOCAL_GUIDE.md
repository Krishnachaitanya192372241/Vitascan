# Local Execution Guide

This guide explains how to configure and execute the Appium End-to-End (E2E) testing framework on your local development machine.

## Prerequisites
Ensure the following packages are installed and configured:
1. **Node.js**: version 18 or above.
2. **Java Development Kit (JDK)**: version 17. Configure `JAVA_HOME` environment variable.
3. **Android Studio & SDK**: Configure `ANDROID_HOME` environment variable and add platform tools to your path.
4. **Appium Server**: Install globally:
   ```bash
   npm install -g appium
   appium driver install uiautomator2
   ```

## Setup Instructions

1. **Install Dependencies**:
   Navigate to the `automation` directory and run:
   ```bash
   npm install
   ```

2. **Launch Mock API Server**:
   ```bash
   cd load-test
   node server.js
   ```

3. **Start Appium Server**:
   Launch Appium on port 4723:
   ```bash
   appium --port 4723
   ```

4. **Prepare Target APK**:
   Make sure you build a debug/signed APK inside `VitaScan` and update the capabilities path in `automation/config/wdio.conf.js`.

5. **Run Suite**:
   ```bash
   cd automation
   node runners/testRunner.js
   ```

## Output Locations
- **Excel reports**: `Test Results/Excel/`
- **HTML Dashboards**: `Test Results/HTML/`
- **Execution JSON logs**: `Test Results/JSON/`
