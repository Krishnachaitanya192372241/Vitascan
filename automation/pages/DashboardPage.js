// pages/DashboardPage.js
const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
    get profileGreeting() { return '//android.widget.TextView[contains(@text, "Welcome back")]'; }
    get userName() { return '//android.widget.TextView[@text="Alex Johnson"]'; }
    get healthScore() { return '//android.widget.TextView[@text="84"]'; }
    get scanTab() { return '~scanner-tab'; }

    async verifyUserGreeting(expectedName) {
        const text = await this.getText(this.userName);
        return text.includes(expectedName);
    }

    async getHealthScoreValue() {
        return await this.getText(this.healthScore);
    }

    async navigateToScanner() {
        await this.click(this.scanTab);
    }
}

module.exports = new DashboardPage();
