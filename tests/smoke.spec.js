// tests/smoke.spec.js
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');

test.describe('KrishiSethu Smoke Tests @smoke', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await loginPage.verifyLoginSuccess();
  });

  test('should load all main pages without errors', async ({ page }) => {
    // Test Dashboard
    await page.click('text=Dashboard');
    await expect(page.locator('h1, h2')).toContainText(/dashboard/i);
    
    // Test Inventory
    await page.click('text=Inventory');
    await expect(page.locator('h1, h2')).toContainText(/inventory|products/i);
    
    // Test POS
    await page.click('text=POS');
    await expect(page.locator('h1, h2')).toContainText(/pos|point of sale|sales/i);
    
    // Test Customers
    await page.click('text=Customers');
    await expect(page.locator('h1, h2')).toContainText(/customers/i);
    
    // Test Reports
    await page.click('text=Reports');
    await expect(page.locator('h1, h2')).toContainText(/reports|analytics/i);
  });

  test('should display correct user information', async ({ page }) => {
    // Check if user is logged in
    await expect(page.locator('text=admin, text=Admin')).toBeVisible();
  });

  test('should have working search functionality', async ({ page }) => {
    await page.click('text=Inventory');
    
    const searchBox = page.locator('input[placeholder*="search"], input[name="search"]');
    if (await searchBox.isVisible()) {
      await searchBox.fill('test');
      // Should not throw error
      await page.waitForTimeout(1000);
    }
  });

  test('should handle navigation without JavaScript errors', async ({ page }) => {
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate through main sections
    await page.click('text=Dashboard');
    await page.click('text=Inventory');
    await page.click('text=POS');
    await page.click('text=Reports');

    // Check for critical JavaScript errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('manifest') &&
      !error.includes('sw.js')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should logout successfully', async ({ page }) => {
    // Find logout button
    const logoutButton = page.locator('button:has-text("Logout"), .logout-btn, [data-action="logout"]');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Should redirect to login or landing page
      await expect(page.locator('text=Login, text=Sign In, text=Get Started')).toBeVisible();
    }
  });
});

test.describe('Performance Smoke Tests @smoke @performance', () => {
  test('should load landing page quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

  test('should load dashboard quickly after login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const startTime = Date.now();
    await loginPage.loginAsAdmin();
    await loginPage.verifyLoginSuccess();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(8000); // Should login and load dashboard within 8 seconds
  });
});

test.describe('Mobile Smoke Tests @smoke @mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should work on mobile viewport', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await loginPage.verifyLoginSuccess();

    // Check mobile navigation
    const mobileMenu = page.locator('.mobile-menu, .hamburger, button[aria-label*="menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('.mobile-nav, .sidebar')).toBeVisible();
    }

    // Verify main content is visible
    await expect(page.locator('.dashboard, .main-content')).toBeVisible();
  });
});
