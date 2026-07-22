# Troubleshooting Guide

This document lists common issues and resolution procedures during test execution.

## Common Appium & Driver Issues

### 1. Appium Command Not Found
- **Symptom**: `npx appium` or `appium` returns command not found.
- **Fix**: Verify Appium is installed globally (`npm install -g appium`). Run `appium --version` to check.

### 2. UiAutomator2 Driver Missing
- **Symptom**: `Requested driver 'uiautomator2' was not installed`
- **Fix**: Run:
  ```bash
  appium driver install uiautomator2
  ```

### 3. ADB/Emulator Connection Error
- **Symptom**: `Could not find a connected Android device`
- **Fix**: Run `adb devices` to verify connection status. If list is empty, restart your emulator.

## Excel & Reporting Issues

### 1. Report directory permissions
- **Symptom**: Permission denied when creating `Test Results/Excel/`
- **Fix**: Verify write permission on the folder. In CI workflows, ensure steps are running with appropriate permissions.

### 2. Missing test cases
- **Symptom**: Excel report contains less than 400 test cases.
- **Fix**: Check `runners/testRunner.js` modulesConfig arrays to ensure counts sum to >= 400.
