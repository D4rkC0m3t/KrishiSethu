// tests/simple-login-test.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Simple Login Test', () => {
  
  test('should click Login as Admin and verify what happens', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/screenshots/01-initial-page.png' });
    
    // Check if we can see the Login as Admin button
    const loginButton = page.locator('button:has-text("👑 Login as Admin")');
    await expect(loginButton).toBeVisible();
    
    console.log('Current URL before login:', await page.url());
    
    // Click "Login as Admin" button
    await loginButton.click();
    
    // Wait a bit for any processing
    await page.waitForTimeout(3000);
    
    // Take screenshot after clicking login
    await page.screenshot({ path: 'test-results/screenshots/02-after-login-click.png' });
    
    console.log('Current URL after login click:', await page.url());
    
    // Wait for any navigation or state changes
    await page.waitForLoadState('networkidle');
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/screenshots/03-final-state.png' });
    
    console.log('Final URL:', await page.url());
    
    // Check what elements are visible now
    const bodyText = await page.textContent('body');
    console.log('Page contains Dashboard:', bodyText.includes('Dashboard'));
    console.log('Page contains Inventory:', bodyText.includes('Inventory'));
    console.log('Page contains POS:', bodyText.includes('POS'));
    
    // Look for any navigation elements
    const navElements = page.locator('nav, .sidebar, [role="navigation"]');
    const navCount = await navElements.count();
    console.log('Navigation elements found:', navCount);
    
    if (navCount > 0) {
      const navText = await navElements.first().textContent();
      console.log('First navigation element text:', navText);
    }
    
    // Check if we're logged in by looking for user-specific elements
    const userElements = page.locator('text=Admin, text=Logout, text=Profile, [data-testid="user-menu"]');
    const userCount = await userElements.count();
    console.log('User-related elements found:', userCount);
    
    // Verify we're not still on login page
    const loginElements = page.locator('text=Login, text=Sign In, input[type="password"]');
    const loginCount = await loginElements.count();
    console.log('Login elements still visible:', loginCount);
    
    // Basic assertion - we should not be on login page anymore
    expect(await page.url()).not.toContain('/login');
  });

  test('should verify the application loads correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check that the page loads without errors
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for any error messages
    const errorElements = page.locator('text=Error, text=404, text=500, .error');
    const errorCount = await errorElements.count();
    console.log('Error elements found:', errorCount);
    
    expect(errorCount).toBe(0);
  });

});
