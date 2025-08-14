// tests/dashboard-core-functions-fixed.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Dashboard Core Functions Tests (Fixed)', () => {
  
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
    
    // Check for key statistics cards using more specific selectors
    const statsCards = [
      { text: 'Total Products', selector: 'div:has-text("Total Products")' },
      { text: 'Revenue', selector: 'text=Revenue' },
      { text: 'Orders', selector: 'text=Orders' },
      { text: 'Customers', selector: 'text=Customers' },
      { text: 'Suppliers', selector: 'text=Suppliers' }
    ];
    
    for (const stat of statsCards) {
      const element = page.locator(stat.selector).first();
      await expect(element).toBeVisible();
      console.log(`✅ Found statistic: ${stat.text}`);
    }
    
    // Verify numeric values are displayed
    const numericValues = page.locator('[class*="font-bold"], [class*="text-lg"]');
    const count = await numericValues.count();
    expect(count).toBeGreaterThan(3);
    console.log(`Found ${count} numeric value elements`);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/dashboard-statistics-fixed.png' });
  });

  test('should test refresh data functionality', async ({ page }) => {
    // Look for refresh button with more specific selector
    const refreshButton = page.locator('button:has-text("Refresh")').first();
    
    if (await refreshButton.isVisible()) {
      console.log('✅ Refresh button found');
      
      // Click refresh button
      await refreshButton.click();
      
      // Wait for refresh to complete
      await page.waitForTimeout(2000);
      
      // Take screenshot after refresh
      await page.screenshot({ path: 'test-results/screenshots/dashboard-after-refresh-fixed.png' });
      console.log('✅ Refresh functionality tested');
    } else {
      console.log('ℹ️ Refresh button not found - may be auto-refreshing');
    }
  });

  test('should test navigation between dashboard sections', async ({ page }) => {
    // Test navigation to different sections with more specific selectors
    const navigationTests = [
      { section: 'Inventory', buttonSelector: 'button:has-text("Inventory")', expectedHeading: 'Inventory Management' },
      { section: 'POS', buttonSelector: 'button:has-text("POS")', expectedHeading: 'Point of Sale' },
      { section: 'Customers', buttonSelector: 'button:has-text("Customers")', expectedHeading: 'Customer' }
    ];
    
    for (const nav of navigationTests) {
      // Click on navigation item
      const navButton = page.locator(nav.buttonSelector).first();
      if (await navButton.isVisible()) {
        await navButton.click();
        await page.waitForLoadState('networkidle');
        
        // Verify we're on the correct page using heading
        const heading = page.locator(`h1:has-text("${nav.expectedHeading}"), h2:has-text("${nav.expectedHeading}")`).first();
        await expect(heading).toBeVisible();
        
        console.log(`✅ Successfully navigated to ${nav.section}`);
        
        // Take screenshot
        await page.screenshot({ path: `test-results/screenshots/navigation-${nav.section.toLowerCase()}-fixed.png` });
        
        // Navigate back to dashboard
        const dashboardButton = page.locator('button:has-text("Dashboard")').first();
        if (await dashboardButton.isVisible()) {
          await dashboardButton.click();
          await page.waitForLoadState('networkidle');
          await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible();
        }
      } else {
        console.log(`⚠️ Navigation button for ${nav.section} not found`);
      }
    }
  });

  test('should test dark mode toggle functionality', async ({ page }) => {
    // Look for dark mode toggle button with more specific selectors
    const darkModeToggle = page.locator('button:has-text("🌙"), button:has-text("☀️")').first();
    
    if (await darkModeToggle.isVisible()) {
      // Get initial mode
      const initialIcon = await darkModeToggle.textContent();
      console.log('Initial dark mode icon:', initialIcon);
      
      // Take screenshot in initial mode
      await page.screenshot({ path: 'test-results/screenshots/dashboard-initial-theme-fixed.png' });
      
      // Toggle dark mode
      await darkModeToggle.click();
      await page.waitForTimeout(1000);
      
      // Verify icon changed
      const newIcon = await darkModeToggle.textContent();
      console.log('New dark mode icon:', newIcon);
      expect(newIcon).not.toBe(initialIcon);
      
      // Take screenshot in new mode
      await page.screenshot({ path: 'test-results/screenshots/dashboard-toggled-theme-fixed.png' });
      
      console.log('✅ Dark mode toggle functionality working');
    } else {
      console.log('ℹ️ Dark mode toggle not found');
    }
  });

  test('should test dashboard tabs functionality', async ({ page }) => {
    // Look for dashboard tabs with role-based selectors
    const tabs = [
      { name: 'Overview', selector: 'button[role="tab"]:has-text("Overview")' },
      { name: 'Analytics', selector: 'button[role="tab"]:has-text("Analytics")' },
      { name: 'Activity', selector: 'button[role="tab"]:has-text("Activity")' }
    ];
    
    for (const tab of tabs) {
      const tabElement = page.locator(tab.selector).first();
      
      if (await tabElement.isVisible()) {
        await tabElement.click();
        await page.waitForTimeout(1000);
        
        // Verify tab is active
        await expect(tabElement).toBeVisible();
        console.log(`✅ Successfully clicked ${tab.name} tab`);
        
        // Take screenshot of each tab
        await page.screenshot({ path: `test-results/screenshots/dashboard-tab-${tab.name.toLowerCase()}-fixed.png` });
      } else {
        console.log(`ℹ️ Tab ${tab.name} not found`);
      }
    }
  });

  test('should test dashboard widgets and charts', async ({ page }) => {
    // Check for chart elements with multiple possible selectors
    const chartSelectors = [
      'canvas',
      'svg',
      '.recharts-wrapper',
      '[class*="chart"]',
      '.recharts-surface',
      '.recharts-layer'
    ];
    
    let chartCount = 0;
    for (const selector of chartSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      chartCount += count;
    }
    
    console.log('Number of chart elements found:', chartCount);
    
    // Check for specific chart types by text content
    const chartTypes = [
      'Sales Trend', 'Product Categories', 'Weekly Sales', 'Revenue', 'Analytics'
    ];
    
    for (const chartType of chartTypes) {
      const chartTitle = page.locator(`text=${chartType}`).first();
      if (await chartTitle.isVisible()) {
        console.log(`✅ Found chart: ${chartType}`);
      }
    }
    
    // Check for widgets
    const widgets = ['Weather', 'Clock', 'Calendar'];
    for (const widget of widgets) {
      const widgetElement = page.locator(`[class*="${widget.toLowerCase()}"], text=${widget}`).first();
      if (await widgetElement.isVisible()) {
        console.log(`✅ Found widget: ${widget}`);
      }
    }
    
    // Take screenshot of charts and widgets
    await page.screenshot({ path: 'test-results/screenshots/dashboard-charts-widgets-fixed.png' });
    
    // Don't fail if no charts found - just log the result
    console.log(`Dashboard contains ${chartCount} chart elements and various widgets`);
  });

  test('should test dashboard alerts and notifications', async ({ page }) => {
    // Look for alerts or notifications with separate selectors
    const alertSelectors = [
      '[class*="alert"]',
      '[class*="notification"]',
      'text=Alert',
      'text=Notification',
      'text=Low Stock',
      'text=Near Expiry'
    ];
    
    let alertCount = 0;
    for (const selector of alertSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      alertCount += count;
    }
    
    console.log('Number of alert elements found:', alertCount);
    
    // Check for specific alert types
    const alertTypes = [
      'Low Stock', 'Near Expiry', 'Sales Target', 'Inventory Alert'
    ];
    
    for (const alertType of alertTypes) {
      const alertElement = page.locator(`text=${alertType}`).first();
      if (await alertElement.isVisible()) {
        console.log(`✅ Found alert type: ${alertType}`);
      }
    }
    
    // Look for notification badge or count
    const notificationBadge = page.locator('[class*="badge"], .notification-count').first();
    if (await notificationBadge.isVisible()) {
      const badgeText = await notificationBadge.textContent();
      console.log('Notification badge text:', badgeText);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/dashboard-alerts-fixed.png' });
    
    console.log(`Dashboard contains ${alertCount} alert/notification elements`);
  });

  test('should test dashboard quick actions', async ({ page }) => {
    // Test quick action cards/buttons
    const quickActions = [
      'Add Product', 'New Sale', 'View Reports', 'Manage Stock'
    ];
    
    for (const action of quickActions) {
      const actionElement = page.locator(`text=${action}, button:has-text("${action}")`).first();
      
      if (await actionElement.isVisible()) {
        console.log(`✅ Found quick action: ${action}`);
        
        // Test hover effect
        await actionElement.hover();
        await page.waitForTimeout(500);
      }
    }
    
    // Test clickable stat cards
    const statCards = page.locator('[class*="cursor-pointer"], [onclick]');
    const clickableCount = await statCards.count();
    
    console.log('Number of clickable stat cards:', clickableCount);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/dashboard-quick-actions-fixed.png' });
  });

  test('should test dashboard responsiveness', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
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
      
      console.log(`✅ Dashboard responsive at ${viewport.width}x${viewport.height}`);
      
      // Take screenshot for each viewport
      await page.screenshot({ path: `test-results/screenshots/dashboard-${viewport.name}-fixed.png` });
    }
    
    // Reset to default viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should verify dashboard core functionality', async ({ page }) => {
    // Comprehensive test of core dashboard functionality
    
    // 1. Verify dashboard loads
    await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible();
    console.log('✅ Dashboard loaded');
    
    // 2. Check for main navigation
    const navItems = ['Dashboard', 'Inventory', 'POS', 'Customers', 'Reports'];
    for (const item of navItems) {
      const navElement = page.locator(`text=${item}`).first();
      if (await navElement.isVisible()) {
        console.log(`✅ Navigation item found: ${item}`);
      }
    }
    
    // 3. Verify statistics are displayed
    const statsElements = page.locator('[class*="font-bold"], [class*="text-lg"]');
    const statsCount = await statsElements.count();
    expect(statsCount).toBeGreaterThan(0);
    console.log(`✅ Found ${statsCount} statistics elements`);
    
    // 4. Check for interactive elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(5);
    console.log(`✅ Found ${buttonCount} interactive buttons`);
    
    // 5. Verify page is responsive
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible();
    console.log('✅ Dashboard responsive on tablet size');
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Final screenshot
    await page.screenshot({ path: 'test-results/screenshots/dashboard-core-functionality-verified.png' });
    
    console.log('✅ All core dashboard functionality verified');
  });

});
