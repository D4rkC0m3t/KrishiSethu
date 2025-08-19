// Quick test script to verify product save functionality
// Run this with: node test-product-save-fix.js

const { test, expect } = require('@playwright/test');

test.describe('Product Save Fix Verification', () => {
  test('Verify Add Product shows proper feedback', async ({ page }) => {
    console.log('🧪 Testing Add Product feedback...');
    
    // Login
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.locator('button:has-text("👑 Login as Admin")');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Navigate to Add Product
    await page.click('button:has-text("Inventory")');
    await page.waitForLoadState('networkidle');
    
    const addProductButton = page.locator('button:has-text("Add Product")');
    await addProductButton.click();
    await page.waitForLoadState('networkidle');
    
    // Fill minimal required fields
    const timestamp = Date.now();
    await page.locator('input[placeholder*="name"]').first().fill(`TEST_${timestamp}`);
    await page.locator('input[placeholder*="price"]').first().fill('99.99');
    
    // Submit and check for feedback
    await page.locator('button:has-text("Save"), button:has-text("Add Product")').click();
    await page.waitForTimeout(3000);
    
    // Check for success/error feedback
    const feedbackVisible = await page.locator('.bg-green-50, .bg-red-50, .bg-blue-50').isVisible();
    const feedbackText = await page.locator('.bg-green-50, .bg-red-50, .bg-blue-50').textContent();
    
    console.log(`📊 Feedback visible: ${feedbackVisible}`);
    console.log(`📊 Feedback text: ${feedbackText}`);
    
    // Should show some feedback
    expect(feedbackVisible).toBeTruthy();
  });

  test('Verify Bulk Add shows proper feedback', async ({ page }) => {
    console.log('🧪 Testing Bulk Add feedback...');
    
    // Login
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.locator('button:has-text("👑 Login as Admin")');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Navigate to Bulk Add
    await page.click('button:has-text("Inventory")');
    await page.waitForLoadState('networkidle');
    
    const bulkAddButton = page.locator('button:has-text("Bulk Add")');
    await bulkAddButton.click();
    await page.waitForLoadState('networkidle');
    
    // Add a test product
    const timestamp = Date.now();
    await page.locator('table tbody tr:first-child input').first().fill(`BULK_TEST_${timestamp}`);
    await page.locator('table tbody tr:first-child input').nth(2).fill('50.00');
    await page.locator('table tbody tr:first-child input').nth(3).fill('75.00');
    
    // Save and check for feedback
    await page.locator('button:has-text("Save All")').click();
    await page.waitForTimeout(5000);
    
    // Check for bulk feedback messages
    const bulkMessages = await page.locator('.text-green-600, .text-red-600').count();
    
    console.log(`📊 Bulk feedback messages: ${bulkMessages}`);
    
    // Should show feedback messages
    expect(bulkMessages).toBeGreaterThan(0);
  });
});
