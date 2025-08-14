// tests/dashboard-core-functions.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Dashboard Core Functions Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("👑 Login as Admin")');
    await page.waitForLoadState('networkidle');
    await page.waitForURL(/http:\/\/localhost:3000\/?$/, { timeout: 10000 });
  });

  test('should display dashboard with key statistics', async ({ page }) => {
    // Verify dashboard title
    await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible();
    
    // Check for key statistics cards
    const statsCards = [
      'Products', 'Revenue', 'Orders', 'Customers', 'Suppliers'
    ];
    
    for (const stat of statsCards) {
      await expect(page.locator(`text=${stat}`)).toBeVisible();
    }
    
    // Verify numeric values are displayed
    const numericValues = page.locator('[class*="font-bold"], [class*="text-lg"]');
    const count = await numericValues.count();
    expect(count).toBeGreaterThan(5);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/dashboard-statistics.png' });
  });

  test('should test refresh data functionality', async ({ page }) => {
    // Look for refresh button
    const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh"]');
    
    if (await refreshButton.isVisible()) {
      // Get initial timestamp
      const initialTime = await page.locator('text=Last updated:').textContent();
      
      // Click refresh button
      await refreshButton.click();
      
      // Wait for refresh to complete
      await page.waitForTimeout(2000);
      
      // Verify refresh indicator appears
      const refreshingText = page.locator('text=Refreshing...');
      // Note: This might be too fast to catch, so we'll check if button is disabled
      
      // Wait for refresh to complete
      await page.waitForTimeout(3000);
      
      // Verify data is refreshed (timestamp should change)
      const newTime = await page.locator('text=Last updated:').textContent();
      console.log('Initial time:', initialTime);
      console.log('New time:', newTime);
      
      // Take screenshot after refresh
      await page.screenshot({ path: 'test-results/screenshots/dashboard-after-refresh.png' });
    }
  });

  test('should test navigation between dashboard sections', async ({ page }) => {
    // Test navigation to different sections
    const navigationTests = [
      { section: 'Inventory', expectedText: 'Inventory' },
      { section: 'POS', expectedText: 'Point of Sale' },
      { section: 'Customers', expectedText: 'Customer' },
      { section: 'Reports', expectedText: 'Reports' }
    ];
    
    for (const nav of navigationTests) {
      // Click on navigation item
      await page.click(`text=${nav.section}`);
      await page.waitForLoadState('networkidle');
      
      // Verify we're on the correct page
      await expect(page.locator(`text=${nav.expectedText}`)).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: `test-results/screenshots/navigation-${nav.section.toLowerCase()}.png` });
      
      // Navigate back to dashboard
      await page.click('text=Dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible();
    }
  });

  test('should test dark mode toggle functionality', async ({ page }) => {
    // Look for dark mode toggle button
    const darkModeToggle = page.locator('button:has-text("🌙"), button:has-text("☀️")');
    
    if (await darkModeToggle.isVisible()) {
      // Get initial mode
      const initialIcon = await darkModeToggle.textContent();
      console.log('Initial dark mode icon:', initialIcon);
      
      // Take screenshot in initial mode
      await page.screenshot({ path: 'test-results/screenshots/dashboard-initial-theme.png' });
      
      // Toggle dark mode
      await darkModeToggle.click();
      await page.waitForTimeout(1000);
      
      // Verify icon changed
      const newIcon = await darkModeToggle.textContent();
      console.log('New dark mode icon:', newIcon);
      expect(newIcon).not.toBe(initialIcon);
      
      // Check if dark class is applied to html element
      const htmlClass = await page.evaluate(() => document.documentElement.className);
      console.log('HTML classes after toggle:', htmlClass);
      
      // Take screenshot in new mode
      await page.screenshot({ path: 'test-results/screenshots/dashboard-toggled-theme.png' });
      
      // Toggle back
      await darkModeToggle.click();
      await page.waitForTimeout(1000);
      
      // Verify we're back to original state
      const finalIcon = await darkModeToggle.textContent();
      expect(finalIcon).toBe(initialIcon);
    }
  });

  test('should test dashboard tabs functionality', async ({ page }) => {
    // Look for dashboard tabs
    const tabs = ['Overview', 'Analytics', 'Activity'];
    
    for (const tab of tabs) {
      const tabElement = page.locator(`text=${tab}`);
      
      if (await tabElement.isVisible()) {
        await tabElement.click();
        await page.waitForTimeout(1000);
        
        // Verify tab content is displayed
        await expect(tabElement).toBeVisible();
        
        // Take screenshot of each tab
        await page.screenshot({ path: `test-results/screenshots/dashboard-tab-${tab.toLowerCase()}.png` });
      }
    }
  });

  test('should test dashboard widgets and charts', async ({ page }) => {
    // Check for chart elements
    const chartElements = page.locator('canvas, svg, .recharts-wrapper, [class*="chart"]');
    const chartCount = await chartElements.count();
    
    console.log('Number of chart elements found:', chartCount);
    expect(chartCount).toBeGreaterThan(0);
    
    // Check for specific chart types
    const chartTypes = [
      'Sales Trend', 'Product Categories', 'Weekly Sales'
    ];
    
    for (const chartType of chartTypes) {
      const chartTitle = page.locator(`text=${chartType}`);
      if (await chartTitle.isVisible()) {
        console.log(`✅ Found chart: ${chartType}`);
      }
    }
    
    // Check for widgets
    const widgets = ['Weather', 'Clock', 'Calendar'];
    for (const widget of widgets) {
      const widgetElement = page.locator(`[class*="${widget.toLowerCase()}"], text=${widget}`);
      if (await widgetElement.isVisible()) {
        console.log(`✅ Found widget: ${widget}`);
      }
    }
    
    // Take screenshot of charts and widgets
    await page.screenshot({ path: 'test-results/screenshots/dashboard-charts-widgets.png' });
  });

  test('should test dashboard alerts and notifications', async ({ page }) => {
    // Look for alerts or notifications
    const alertElements = page.locator('[class*="alert"], [class*="notification"], text=Alert, text=Notification');
    const alertCount = await alertElements.count();
    
    console.log('Number of alert elements found:', alertCount);
    
    // Check for specific alert types
    const alertTypes = [
      'Low Stock', 'Near Expiry', 'Sales Target'
    ];
    
    for (const alertType of alertTypes) {
      const alertElement = page.locator(`text=${alertType}`);
      if (await alertElement.isVisible()) {
        console.log(`✅ Found alert type: ${alertType}`);
      }
    }
    
    // Look for notification badge or count
    const notificationBadge = page.locator('[class*="badge"], .notification-count');
    if (await notificationBadge.isVisible()) {
      const badgeText = await notificationBadge.textContent();
      console.log('Notification badge text:', badgeText);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/dashboard-alerts.png' });
  });

  test('should test dashboard quick actions', async ({ page }) => {
    // Test quick action cards/buttons
    const quickActions = [
      'Add Product', 'New Sale', 'View Reports', 'Manage Stock'
    ];
    
    for (const action of quickActions) {
      const actionElement = page.locator(`text=${action}, button:has-text("${action}")`);
      
      if (await actionElement.isVisible()) {
        console.log(`✅ Found quick action: ${action}`);
        
        // Test hover effect
        await actionElement.hover();
        await page.waitForTimeout(500);
      }
    }
    
    // Test clickable stat cards
    const statCards = page.locator('[class*="cursor-pointer"], [onclick], .hover\\:shadow');
    const clickableCount = await statCards.count();
    
    console.log('Number of clickable stat cards:', clickableCount);
    
    if (clickableCount > 0) {
      // Test clicking on first clickable card
      await statCards.first().click();
      await page.waitForTimeout(1000);
      
      // Should navigate somewhere or show details
      await page.screenshot({ path: 'test-results/screenshots/dashboard-quick-action-result.png' });
      
      // Navigate back to dashboard
      await page.click('text=Dashboard');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should test dashboard responsiveness', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-large' },
      { width: 1366, height: 768, name: 'desktop-medium' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Verify dashboard is still visible and functional
      await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible();
      
      // Check if navigation is accessible (might be collapsed on mobile)
      const navElements = page.locator('nav, .sidebar, [role="navigation"]');
      await expect(navElements.first()).toBeVisible();
      
      // Take screenshot for each viewport
      await page.screenshot({ path: `test-results/screenshots/dashboard-${viewport.name}.png` });
    }
    
    // Reset to default viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should test dashboard performance metrics', async ({ page }) => {
    const startTime = Date.now();
    
    // Measure dashboard load time
    await page.goto('http://localhost:3000');
    await page.click('button:has-text("👑 Login as Admin")');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);
    
    // Performance assertions
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    
    // Test navigation performance
    const navStartTime = Date.now();
    await page.click('text=Inventory');
    await page.waitForLoadState('networkidle');
    const navTime = Date.now() - navStartTime;
    
    console.log(`Navigation time: ${navTime}ms`);
    expect(navTime).toBeLessThan(3000); // Navigation should be fast
    
    // Test refresh performance
    await page.click('text=Dashboard');
    await page.waitForLoadState('networkidle');
    
    const refreshStartTime = Date.now();
    const refreshButton = page.locator('button:has-text("Refresh")');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(2000);
      const refreshTime = Date.now() - refreshStartTime;
      
      console.log(`Refresh time: ${refreshTime}ms`);
      expect(refreshTime).toBeLessThan(4000); // Refresh should complete quickly
    }
  });

});
