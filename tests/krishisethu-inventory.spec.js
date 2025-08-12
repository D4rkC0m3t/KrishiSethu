// tests/krishisethu-inventory.spec.js
const { test, expect } = require('@playwright/test');

// Test data configuration
const testData = {
  admin: {
    email: 'admin@krishisethu.com',
    password: 'admin123'
  },
  testProduct: {
    name: 'Test Fertilizer NPK',
    code: 'TF-NPK-001',
    category: 'NPK Fertilizers',
    brand: 'Test Brand',
    quantity: '100',
    price: '2500',
    gst: '18',
    description: 'Test NPK fertilizer for automated testing'
  },
  urls: {
    base: 'http://localhost:3001',
    login: 'http://localhost:3001/login',
    dashboard: 'http://localhost:3001/dashboard'
  }
};

test.describe('KrishiSethu Inventory Management System', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(testData.urls.base);
    
    // Check if we're on landing page, then navigate to login
    const getStartedButton = page.locator('text=Get Started Free');
    if (await getStartedButton.isVisible()) {
      await getStartedButton.click();
    }
    
    // Wait for login page to load
    await expect(page.locator('h1, h2')).toContainText(/login|sign in/i);
    
    // Perform login
    await page.fill('input[type="email"], input[name="email"], #email', testData.admin.email);
    await page.fill('input[type="password"], input[name="password"], #password', testData.admin.password);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait for dashboard to load
    await expect(page.locator('h1, h2, [data-testid="dashboard-title"]')).toContainText(/dashboard/i);
  });

  test('should display dashboard with key metrics', async ({ page }) => {
    // Verify dashboard elements are visible
    await expect(page.locator('text=Total Products, text=Products')).toBeVisible();
    await expect(page.locator('text=Revenue, text=Sales')).toBeVisible();
    await expect(page.locator('text=Customers, text=Suppliers')).toBeVisible();
    
    // Check for charts/analytics
    await expect(page.locator('canvas, svg, .recharts-wrapper')).toBeVisible();
  });

  test('should navigate to inventory management', async ({ page }) => {
    // Navigate to inventory
    await page.click('text=Inventory, a[href*="inventory"], button:has-text("Inventory")');
    
    // Verify inventory page loaded
    await expect(page.locator('h1, h2')).toContainText(/inventory|products/i);
    await expect(page.locator('text=Add Product, button:has-text("Add")')).toBeVisible();
  });

  test('should add a new product successfully', async ({ page }) => {
    // Navigate to inventory
    await page.click('text=Inventory');
    await page.click('text=Add Product, button:has-text("Add Product")');
    
    // Fill product form
    await page.fill('input[name="name"], #productName, input[placeholder*="name"]', testData.testProduct.name);
    await page.fill('input[name="code"], #productCode, input[placeholder*="code"]', testData.testProduct.code);
    
    // Select category if dropdown exists
    const categorySelect = page.locator('select[name="category"], #category');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption(testData.testProduct.category);
    }
    
    // Fill quantity and price
    await page.fill('input[name="quantity"], #quantity, input[placeholder*="quantity"]', testData.testProduct.quantity);
    await page.fill('input[name="price"], #price, input[placeholder*="price"]', testData.testProduct.price);
    
    // Fill GST if field exists
    const gstField = page.locator('input[name="gst"], #gst, input[placeholder*="gst"]');
    if (await gstField.isVisible()) {
      await gstField.fill(testData.testProduct.gst);
    }
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Add Product")');
    
    // Verify success
    await expect(page.locator('.toast, .alert, .notification')).toContainText(/success|added|created/i);
  });

  test('should search for products', async ({ page }) => {
    // Navigate to inventory
    await page.click('text=Inventory');
    
    // Search for product
    const searchBox = page.locator('input[placeholder*="search"], input[name="search"], #search');
    await searchBox.fill(testData.testProduct.name);
    
    // Verify search results
    await expect(page.locator('table, .product-list, .inventory-grid')).toContainText(testData.testProduct.name);
  });

  test('should update product quantity', async ({ page }) => {
    // Navigate to inventory
    await page.click('text=Inventory');
    
    // Search for the test product
    await page.fill('input[placeholder*="search"]', testData.testProduct.name);
    
    // Click edit button
    await page.click('button:has-text("Edit"), .edit-btn, [data-action="edit"]');
    
    // Update quantity
    const quantityField = page.locator('input[name="quantity"], #quantity');
    await quantityField.clear();
    await quantityField.fill('150');
    
    // Save changes
    await page.click('button:has-text("Update"), button:has-text("Save"), button[type="submit"]');
    
    // Verify success
    await expect(page.locator('.toast, .alert')).toContainText(/updated|success/i);
  });

  test('should access POS system', async ({ page }) => {
    // Navigate to POS
    await page.click('text=POS, a[href*="pos"], button:has-text("POS")');
    
    // Verify POS interface
    await expect(page.locator('h1, h2')).toContainText(/pos|point of sale|sales/i);
    await expect(page.locator('input[placeholder*="search"], .product-search')).toBeVisible();
    await expect(page.locator('.cart, .order-summary, text=Total')).toBeVisible();
  });

  test('should generate sales report', async ({ page }) => {
    // Navigate to reports
    await page.click('text=Reports, a[href*="reports"], button:has-text("Reports")');
    
    // Verify reports page
    await expect(page.locator('h1, h2')).toContainText(/reports|analytics/i);
    
    // Check for report elements
    await expect(page.locator('canvas, svg, .chart, .recharts-wrapper')).toBeVisible();
    await expect(page.locator('text=Sales, text=Revenue, text=Profit')).toBeVisible();
  });

  test('should manage customers', async ({ page }) => {
    // Navigate to customers
    await page.click('text=Customers, a[href*="customers"], button:has-text("Customers")');
    
    // Verify customers page
    await expect(page.locator('h1, h2')).toContainText(/customers|customer management/i);
    await expect(page.locator('button:has-text("Add Customer"), text=Add Customer')).toBeVisible();
  });

  test('should access settings', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings, a[href*="settings"], button:has-text("Settings")');
    
    // Verify settings page
    await expect(page.locator('h1, h2')).toContainText(/settings|configuration/i);
  });

  test('should logout successfully', async ({ page }) => {
    // Find and click logout button
    await page.click('button:has-text("Logout"), .logout-btn, [data-action="logout"]');
    
    // Verify redirect to login or landing page
    await expect(page.locator('text=Login, text=Sign In, text=Get Started')).toBeVisible();
  });

  test('should handle mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile navigation
    const mobileMenu = page.locator('.mobile-menu, .hamburger, button[aria-label*="menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('.mobile-nav, .sidebar')).toBeVisible();
    }
    
    // Verify responsive elements
    await expect(page.locator('.dashboard, .main-content')).toBeVisible();
  });

  test('should delete product (cleanup)', async ({ page }) => {
    // Navigate to inventory
    await page.click('text=Inventory');
    
    // Search for test product
    await page.fill('input[placeholder*="search"]', testData.testProduct.name);
    
    // Click delete button
    await page.click('button:has-text("Delete"), .delete-btn, [data-action="delete"]');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
    
    // Verify success
    await expect(page.locator('.toast, .alert')).toContainText(/deleted|removed|success/i);
  });

});

// Performance tests
test.describe('Performance Tests', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(testData.urls.base);
    await page.locator('text=Get Started Free').click();
    await page.fill('input[type="email"]', testData.admin.email);
    await page.fill('input[type="password"]', testData.admin.password);
    await page.click('button[type="submit"]');
    
    await expect(page.locator('h1, h2')).toContainText(/dashboard/i);
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });
});

// API tests (if backend endpoints are available)
test.describe('API Integration Tests', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Navigate to inventory
    await page.click('text=Inventory');
    
    // Intercept API calls and simulate error
    await page.route('**/api/products', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // Refresh page to trigger API call
    await page.reload();
    
    // Verify error handling
    await expect(page.locator('.error, .alert-error, text=Error')).toBeVisible();
  });
});
