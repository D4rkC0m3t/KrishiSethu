// tests/functional-admin.spec.js
const { test, expect } = require('@playwright/test');

test.describe('KrishiSethu Admin Functional Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click "Login as Admin" button
    await page.click('button:has-text("👑 Login as Admin")');

    // Wait for authentication and redirect
    await page.waitForLoadState('networkidle');

    // Wait for either root path or dashboard - the app redirects to root after login
    await page.waitForURL(/http:\/\/localhost:3000\/?$/, { timeout: 10000 });
  });

  test('should successfully login as admin and display dashboard', async ({ page }) => {
    // Verify we're logged in and on the main application
    await expect(page).toHaveURL(/http:\/\/localhost:3000\/?$/);

    // Check for dashboard elements - look for sidebar or main content
    const dashboardElements = page.locator('nav, .sidebar, main, [role="main"], .dashboard');
    await expect(dashboardElements.first()).toBeVisible();

    // Look for navigation elements that indicate we're in the admin dashboard
    const navElements = page.locator('text=Dashboard, text=Inventory, text=POS, text=Reports');
    await expect(navElements.first()).toBeVisible();

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/screenshots/admin-dashboard.png' });
  });

  test('should navigate to inventory management', async ({ page }) => {
    // Click on Inventory navigation
    await page.click('text=Inventory, a[href*="inventory"], [href*="inventory"]');
    
    // Wait for inventory page to load
    await page.waitForLoadState('networkidle');
    
    // Verify we're on inventory page
    await expect(page).toHaveURL(/.*inventory.*/);
    
    // Check for inventory elements
    const inventoryElements = page.locator('text=Add Product, text=Search, input[placeholder*="search"]');
    await expect(inventoryElements.first()).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/admin-inventory.png' });
  });

  test('should navigate to POS system', async ({ page }) => {
    // Click on POS navigation
    await page.click('text=POS, a[href*="pos"], [href*="pos"]');
    
    // Wait for POS page to load
    await page.waitForLoadState('networkidle');
    
    // Verify we're on POS page
    await expect(page).toHaveURL(/.*pos.*/);
    
    // Check for POS elements
    const posElements = page.locator('text=Point of Sale, text=Cart, text=Total');
    await expect(posElements.first()).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/admin-pos.png' });
  });

  test('should navigate to customers section', async ({ page }) => {
    // Click on Customers navigation
    await page.click('text=Customers, a[href*="customers"], [href*="customers"]');
    
    // Wait for customers page to load
    await page.waitForLoadState('networkidle');
    
    // Verify we're on customers page
    await expect(page).toHaveURL(/.*customers.*/);
    
    // Check for customer elements
    const customerElements = page.locator('text=Add Customer, text=Customer List, input[placeholder*="search"]');
    await expect(customerElements.first()).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/admin-customers.png' });
  });

  test('should navigate to reports section', async ({ page }) => {
    // Click on Reports navigation
    await page.click('text=Reports, a[href*="reports"], [href*="reports"]');
    
    // Wait for reports page to load
    await page.waitForLoadState('networkidle');
    
    // Verify we're on reports page
    await expect(page).toHaveURL(/.*reports.*/);
    
    // Check for report elements
    const reportElements = page.locator('text=Sales Report, text=Inventory Report, text=Generate');
    await expect(reportElements.first()).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/admin-reports.png' });
  });

  test('should test sidebar navigation functionality', async ({ page }) => {
    // Test sidebar toggle (if exists)
    const sidebarToggle = page.locator('button[aria-label*="menu"], .sidebar-toggle, [data-testid="sidebar-toggle"]');
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
      await page.waitForTimeout(500); // Wait for animation
    }
    
    // Test navigation links in sidebar
    const navLinks = page.locator('nav a, .sidebar a, [role="navigation"] a');
    const linkCount = await navLinks.count();
    
    expect(linkCount).toBeGreaterThan(0);
    
    // Take screenshot of navigation
    await page.screenshot({ path: 'test-results/screenshots/admin-navigation.png' });
  });

  test('should test responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for responsive changes
    await page.waitForTimeout(1000);
    
    // Check if mobile navigation works
    const mobileMenu = page.locator('button[aria-label*="menu"], .mobile-menu-button, [data-testid="mobile-menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await page.waitForTimeout(500);
    }
    
    // Take screenshot of mobile view
    await page.screenshot({ path: 'test-results/screenshots/admin-mobile.png' });
    
    // Reset to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should test search functionality', async ({ page }) => {
    // Go to inventory page first
    await page.click('text=Inventory, a[href*="inventory"], [href*="inventory"]');
    await page.waitForLoadState('networkidle');
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="search"], input[name="search"], #search');
    
    if (await searchInput.isVisible()) {
      // Test search functionality
      await searchInput.fill('test');
      await page.waitForTimeout(1000); // Wait for search results
      
      // Take screenshot of search results
      await page.screenshot({ path: 'test-results/screenshots/admin-search.png' });
      
      // Clear search
      await searchInput.clear();
    }
  });

  test('should test dark mode toggle (if available)', async ({ page }) => {
    // Look for dark mode toggle
    const darkModeToggle = page.locator('button[aria-label*="dark"], button[aria-label*="theme"], .theme-toggle, [data-testid="theme-toggle"]');
    
    if (await darkModeToggle.isVisible()) {
      // Toggle dark mode
      await darkModeToggle.click();
      await page.waitForTimeout(500);
      
      // Take screenshot in dark mode
      await page.screenshot({ path: 'test-results/screenshots/admin-dark-mode.png' });
      
      // Toggle back to light mode
      await darkModeToggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('should verify page performance', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000');
    await page.click('button:has-text("👑 Login as Admin")');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Verify page loads within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`Dashboard load time: ${loadTime}ms`);
  });

});
