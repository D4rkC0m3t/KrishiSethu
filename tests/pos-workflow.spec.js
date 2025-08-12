// tests/pos-workflow.spec.js
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');
const { InventoryPage } = require('./pages/InventoryPage');
const { POSPage } = require('./pages/POSPage');
const testData = require('./test-data.json');

test.describe('POS Workflow Tests @regression', () => {
  let loginPage, inventoryPage, posPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    posPage = new POSPage(page);

    // Login as admin
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await loginPage.verifyLoginSuccess();
  });

  test('should complete full sales workflow', async ({ page }) => {
    // Step 1: Add a test product to inventory
    await inventoryPage.goto();
    await inventoryPage.addProduct(testData.testProducts[0]);

    // Step 2: Navigate to POS
    await posPage.goto();
    await posPage.verifyPOSPageLoaded();

    // Step 3: Add product to cart
    await posPage.addProductToCart(testData.testProducts[0].name, 2);
    await posPage.verifyProductInCart(testData.testProducts[0].name);

    // Step 4: Verify cart total
    const cartItemCount = await posPage.getCartItemCount();
    expect(cartItemCount).toBeGreaterThan(0);

    // Step 5: Complete sale
    await posPage.proceedToCheckout();
    await posPage.completeSale({
      paymentMethod: 'cash',
      customer: testData.testCustomers[0].name
    });

    // Step 6: Cleanup - remove test product
    await inventoryPage.goto();
    await inventoryPage.deleteProduct(testData.testProducts[0].name);
  });

  test('should handle multiple products in cart', async ({ page }) => {
    // Add multiple test products
    await inventoryPage.goto();
    for (const product of testData.testProducts.slice(0, 2)) {
      await inventoryPage.addProduct(product);
    }

    // Navigate to POS and add products to cart
    await posPage.goto();
    for (const product of testData.testProducts.slice(0, 2)) {
      await posPage.addProductToCart(product.name, 1);
      await posPage.verifyProductInCart(product.name);
    }

    // Verify cart has multiple items
    const cartItemCount = await posPage.getCartItemCount();
    expect(cartItemCount).toBe(2);

    // Complete sale
    await posPage.proceedToCheckout();
    await posPage.completeSale({ paymentMethod: 'cash' });

    // Cleanup
    await inventoryPage.goto();
    for (const product of testData.testProducts.slice(0, 2)) {
      await inventoryPage.deleteProduct(product.name);
    }
  });

  test('should update product quantities in cart', async ({ page }) => {
    // Add test product
    await inventoryPage.goto();
    await inventoryPage.addProduct(testData.testProducts[0]);

    // Navigate to POS and add product
    await posPage.goto();
    await posPage.addProductToCart(testData.testProducts[0].name, 1);

    // Update quantity
    await posPage.updateProductQuantity(testData.testProducts[0].name, 3);

    // Verify updated quantity reflected in total
    const total = await posPage.getTotalAmount();
    const expectedTotal = parseFloat(testData.testProducts[0].price) * 3;
    expect(Math.abs(total - expectedTotal)).toBeLessThan(1); // Allow for small rounding differences

    // Cleanup
    await posPage.clearCart();
    await inventoryPage.goto();
    await inventoryPage.deleteProduct(testData.testProducts[0].name);
  });

  test('should remove products from cart', async ({ page }) => {
    // Add test product
    await inventoryPage.goto();
    await inventoryPage.addProduct(testData.testProducts[0]);

    // Navigate to POS and add product
    await posPage.goto();
    await posPage.addProductToCart(testData.testProducts[0].name, 1);
    await posPage.verifyProductInCart(testData.testProducts[0].name);

    // Remove product from cart
    await posPage.removeProductFromCart(testData.testProducts[0].name);
    await posPage.verifyProductNotInCart(testData.testProducts[0].name);

    // Verify cart is empty
    const cartItemCount = await posPage.getCartItemCount();
    expect(cartItemCount).toBe(0);

    // Cleanup
    await inventoryPage.goto();
    await inventoryPage.deleteProduct(testData.testProducts[0].name);
  });

  test('should apply discounts correctly', async ({ page }) => {
    // Add test product
    await inventoryPage.goto();
    await inventoryPage.addProduct(testData.testProducts[0]);

    // Navigate to POS and add product
    await posPage.goto();
    await posPage.addProductToCart(testData.testProducts[0].name, 1);

    // Apply discount
    await posPage.proceedToCheckout();
    await posPage.applyDiscount(10); // 10% or ₹10 discount

    // Verify discount is applied
    const total = await posPage.getTotalAmount();
    const originalPrice = parseFloat(testData.testProducts[0].price);
    expect(total).toBeLessThan(originalPrice);

    // Complete sale
    await posPage.completeSale({ paymentMethod: 'cash' });

    // Cleanup
    await inventoryPage.goto();
    await inventoryPage.deleteProduct(testData.testProducts[0].name);
  });

  test('should handle different payment methods', async ({ page }) => {
    // Add test product
    await inventoryPage.goto();
    await inventoryPage.addProduct(testData.testProducts[0]);

    // Test cash payment
    await posPage.goto();
    await posPage.addProductToCart(testData.testProducts[0].name, 1);
    await posPage.proceedToCheckout();
    await posPage.completeSale({ paymentMethod: 'cash' });

    // Test card payment (if available)
    await posPage.addProductToCart(testData.testProducts[0].name, 1);
    await posPage.proceedToCheckout();
    await posPage.completeSale({ paymentMethod: 'card' });

    // Cleanup
    await inventoryPage.goto();
    await inventoryPage.deleteProduct(testData.testProducts[0].name);
  });

  test('should search products in POS', async ({ page }) => {
    // Add test product
    await inventoryPage.goto();
    await inventoryPage.addProduct(testData.testProducts[0]);

    // Navigate to POS and search
    await posPage.goto();
    await posPage.searchProduct(testData.testProducts[0].name);

    // Verify product appears in search results
    await expect(page.locator(posPage.productGrid)).toContainText(testData.testProducts[0].name);

    // Cleanup
    await inventoryPage.goto();
    await inventoryPage.deleteProduct(testData.testProducts[0].name);
  });
});
