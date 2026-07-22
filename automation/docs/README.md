# Appium E2E Automation Framework

This directory contains the Appium-based End-to-End automation framework for the Android application.

## Directory Structure
- `config/`: WebdriverIO configuration for Appium
- `pages/`: Page Object Models for UI screens
- `tests/`: Mocha specifications for Appium E2E validation
- `data/`: JSON test data
- `utils/`: Loggers, screenshots, and multi-format Excel/HTML generators
- `runners/`: Master test orchestrator (`testRunner.js`)
- `reports/`: Generated Excel reports, HTML files, and JSON summaries

## Local Execution
Ensure you have Node.js, Java SDK, Android SDK, and an Emulator running.

1. Install dependencies:
```bash
npm install
```
2. Start Appium Server (if not running globally):
```bash
npx appium
```
3. Run the automation suite:
```bash
node runners/testRunner.js
```

## GitHub Actions CI/CD
The project includes a `.github/workflows/android-e2e.yml` which automatically:
- Starts a reactive Android Emulator.
- Launches Appium.
- Executes the tests.
- Generates Excel, HTML, and JSON reports for 400 test cases.
- Archives results to GitHub Pages.
