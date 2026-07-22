# CI/CD Execution Guide

This guide details the pipeline workflow, secrets, triggers, and execution states.

## Workflow File
The E2E automation is governed by:
- `.github/workflows/android-e2e.yml`

## Triggers
1. **Push to Main/Master**: Triggers compilation, tests, and Pages deployment.
2. **Pull Request**: Performs validation tests.
3. **Workflow Dispatch**: Allows manual trigger with custom parameters.
4. **Nightly Schedule**: Runs tests at 2:00 AM UTC.

## Job Pipeline Steps
- **Checkout Repository**: Obtains active commit source.
- **Environment Setup**: Configures JDK 17, Android SDK, Node.js.
- **Gradle Build**: Builds and packages `app-debug.apk`.
- **Android Emulator Runner**: Starts a headless x86_64 Emulator.
- **Appium Server Setup**: Launches Appium service.
- **Execution**: Triggers `testRunner.js` executing 400+ E2E assertions.
- **Upload Artifacts**: Uploads reports to GitHub artifacts.
- **GitHub Pages Deployment**: Deploys reports directory containing execution history.

## Secrets Required
- None required for public repositories. Private repositories require standard `ACTIONS_DEPLOY_KEY` or personal access tokens (PAT) for custom pages setups.
