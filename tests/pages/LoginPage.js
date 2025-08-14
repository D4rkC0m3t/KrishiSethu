// tests/pages/LoginPage.js
const { expect } = require('@playwright/test');

class LoginPage {
  constructor(page) {
    this.page = page;
    
    // Selectors
    this.emailField = "input[type='email'], input[name='email'], #email";
    this.passwordField = "input[type='password'], input[name='password'], #password";
    this.loginButton = "button[type='submit'], button:has-text('Login'), button:has-text('Sign In')";
    this.getStartedButton = "text=Get Started Free";
    this.errorMessage = ".error, .alert-error, .login-error";
    this.forgotPasswordLink = "text=Forgot Password, a[href*='forgot']";
  }

  async goto(baseUrl = 'http://localhost:3000') {
    await this.page.goto(baseUrl);
    
    // Check if we're on landing page, then navigate to login
    const getStartedButton = this.page.locator(this.getStartedButton);
    if (await getStartedButton.isVisible()) {
      await getStartedButton.click();
    }
    
    // Wait for login page to load
    await expect(this.page.locator('h1, h2')).toContainText(/login|sign in/i);
  }

  async login(email, password) {
    await this.page.fill(this.emailField, email);
    await this.page.fill(this.passwordField, password);
    await this.page.click(this.loginButton);
  }

  async loginAsAdmin() {
    await this.login('admin@krishisethu.com', 'admin123');
  }

  async loginAsManager() {
    await this.login('manager@krishisethu.com', 'manager123');
  }

  async loginAsStaff() {
    await this.login('staff@krishisethu.com', 'staff123');
  }

  async verifyLoginSuccess() {
    // Wait for dashboard to load
    await expect(this.page.locator('h1, h2, [data-testid="dashboard-title"]')).toContainText(/dashboard/i);
  }

  async verifyLoginError() {
    await expect(this.page.locator(this.errorMessage)).toBeVisible();
  }

  async clickForgotPassword() {
    await this.page.click(this.forgotPasswordLink);
  }

  async loginAsAdmin() {
    const testData = require('../test-data.json');
    await this.login(testData.users.admin.email, testData.users.admin.password);
  }

  async loginAsDemo() {
    const testData = require('../test-data.json');
    await this.login(testData.users.demo.email, testData.users.demo.password);
  }

  async loginAsTestUser() {
    const testData = require('../test-data.json');
    await this.login(testData.users.testUser.email, testData.users.testUser.password);
  }

  async loginAsUser() {
    const testData = require('../test-data.json');
    await this.login(testData.users.staff.email, testData.users.staff.password);
  }
}

module.exports = { LoginPage };
