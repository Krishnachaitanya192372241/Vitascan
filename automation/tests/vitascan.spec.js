// tests/vitascan.spec.js
const LoginPage = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');

describe('VitaScan Core E2E Verification Spec', () => {
    before(async () => {
        // Appium initial driver configurations could be placed here
    });

    it('should show welcome layout screen elements', async () => {
        const welcomeText = await LoginPage.isDisplayed('//android.widget.TextView[@text="Welcome to VitaScan"]');
        console.log(`Welcome text visibility: ${welcomeText}`);
    });

    it('should type username and password fields', async () => {
        await LoginPage.login('alex.johnson@vitascan.com', 'SecurePassword123');
    });

    it('should successfully view home dashboard components', async () => {
        const isUserVisible = await DashboardPage.verifyUserGreeting('Alex Johnson');
        console.log(`User Alex Johnson visible on dashboard: ${isUserVisible}`);

        const score = await DashboardPage.getHealthScoreValue();
        console.log(`Retrieved Health Score from widget: ${score}`);
    });
});
