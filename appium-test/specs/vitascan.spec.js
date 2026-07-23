// specs/vitascan.spec.js
describe('VitaScan Mobile Application E2E Test Suite', () => {
    it('should verify the welcome screen displays correctly', async () => {
        const welcomeTitle = await $('//android.widget.TextView[@text="Welcome to VitaScan"]');
        await expect(welcomeTitle).toBeDisplayed();
        
        const getStartedBtn = await $('~get-started-button');
        await getStartedBtn.click();
    });

    it('should perform user login successfully', async () => {
        const emailInput = await $('~email-input');
        const passwordInput = await $('~password-input');
        const loginBtn = await $('~login-button');

        await emailInput.setValue('testuser@vitascan.com');
        await passwordInput.setValue('SecurePassword123');
        await loginBtn.click();

        // Verify we navigate to dashboard
        const dashboardHeader = await $('//android.widget.TextView[@text="Alex Johnson"]');
        await expect(dashboardHeader).toBeDisplayed();
    });

    it('should view dashboard and verify health score widget', async () => {
        const healthScore = await $('//android.widget.TextView[@text="84"]');
        await expect(healthScore).toBeDisplayed();

        const calorieWidget = await $('//android.widget.TextView[@text="Calories"]');
        await expect(calorieWidget).toBeDisplayed();
    });

    it('should launch the camera scanner screen', async () => {
        // Tap on scanner tab
        const scannerTab = await $('~scanner-tab');
        await scannerTab.click();

        // Verify overlay elements are visible
        const overlay = await $('~scanner-overlay');
        await expect(overlay).toBeDisplayed();
    });
});
