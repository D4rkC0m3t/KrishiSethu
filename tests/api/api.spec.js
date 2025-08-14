// tests/api/api.spec.js
const { test, expect } = require('@playwright/test');

test.describe('KrishiSethu API Tests', () => {
  let apiContext;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: process.env.API_URL || 'http://localhost:3000/api',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      }
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('should handle CORS properly', async () => {
    const response = await apiContext.get('/products', {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    
    // Should not be blocked by CORS
    expect(response.status()).not.toBe(403);
  });

  test('should handle invalid endpoints gracefully', async () => {
    const response = await apiContext.get('/invalid-endpoint');
    
    // Should return 404 or appropriate error
    expect([404, 500]).toContain(response.status());
  });

  test('should handle malformed requests', async () => {
    const response = await apiContext.post('/products', {
      data: 'invalid json'
    });
    
    // Should return 400 Bad Request
    expect([400, 422, 500]).toContain(response.status());
  });

  test('should respond within acceptable time', async () => {
    const startTime = Date.now();
    
    const response = await apiContext.get('/products');
    
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
  });

  test('should handle large payloads', async () => {
    const largeData = {
      products: Array(100).fill({
        name: 'Test Product',
        code: 'TEST-001',
        price: 100,
        quantity: 50
      })
    };

    const response = await apiContext.post('/bulk-products', {
      data: largeData
    });
    
    // Should handle large payloads without timeout
    expect([200, 201, 400, 422]).toContain(response.status());
  });
});

test.describe('Firebase Integration Tests', () => {
  test('should connect to Firebase', async ({ page }) => {
    // Navigate to app and check Firebase connection
    await page.goto('/');
    
    // Check for Firebase initialization errors in console
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Firebase')) {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(3000);
    
    // Should not have Firebase connection errors
    expect(errors.length).toBe(0);
  });

  test('should handle offline mode', async ({ page, context }) => {
    await page.goto('/');
    
    // Go offline
    await context.setOffline(true);
    
    // App should still be functional (PWA offline support)
    await page.reload();
    
    // Should show offline indicator or cached content
    const offlineIndicator = page.locator('text=offline, .offline-indicator');
    const cachedContent = page.locator('.dashboard, .main-content');
    
    const hasOfflineSupport = await offlineIndicator.isVisible() || await cachedContent.isVisible();
    expect(hasOfflineSupport).toBeTruthy();
    
    // Go back online
    await context.setOffline(false);
  });
});
