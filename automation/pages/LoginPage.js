// pages/LoginPage.js
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
    get emailInput() { return '~email-input'; }
    get passwordInput() { return '~password-input'; }
    get loginButton() { return '~login-button'; }
    get errorText() { return '~error-message'; }

    async login(email, password) {
        await this.type(this.emailInput, email);
        await this.type(this.passwordInput, password);
        await this.click(this.loginButton);
    }

    async getErrorMessage() {
        return await this.getText(this.errorText);
    }
}

module.exports = new LoginPage();
