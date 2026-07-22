// pages/BasePage.js
class BasePage {
    async findElement(selector) {
        return await $(selector);
    }

    async click(selector) {
        const element = await this.findElement(selector);
        await element.waitForDisplayed({ timeout: 10000 });
        await element.click();
    }

    async type(selector, value) {
        const element = await this.findElement(selector);
        await element.waitForDisplayed({ timeout: 10000 });
        await element.setValue(value);
    }

    async getText(selector) {
        const element = await this.findElement(selector);
        await element.waitForDisplayed({ timeout: 10000 });
        return await element.getText();
    }

    async isDisplayed(selector) {
        try {
            const element = await this.findElement(selector);
            return await element.isDisplayed();
        } catch (error) {
            return false;
        }
    }
}

module.exports = BasePage;
