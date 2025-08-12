// tests/pages/POSPage.js
const { expect } = require('@playwright/test');

class POSPage {
  constructor(page) {
    this.page = page;
    
    // Selectors
    this.productSearch = "input[placeholder*='search'], .product-search, #productSearch";
    this.productGrid = ".product-grid, .pos-products, .product-list";
    this.cart = ".cart, .order-summary, .pos-cart";
    this.cartItems = ".cart-item, .order-item";
    this.totalAmount = ".total-amount, .grand-total, text=Total";
    this.quantityInput = "input[name='quantity'], .quantity-input";
    this.addToCartButton = "button:has-text('Add to Cart'), .add-to-cart";
    this.removeFromCartButton = "button:has-text('Remove'), .remove-item";
    this.checkoutButton = "button:has-text('Checkout'), button:has-text('Complete Sale')";
    this.paymentMethodSelect = "select[name='paymentMethod'], #paymentMethod";
    this.customerSelect = "select[name='customer'], #customer";
    this.discountInput = "input[name='discount'], #discount";
    this.confirmSaleButton = "button:has-text('Confirm Sale'), button:has-text('Complete')";
    this.successMessage = ".toast, .alert, .notification";
    this.printReceiptButton = "button:has-text('Print Receipt'), .print-receipt";
  }

  async goto() {
    await this.page.click("text=POS, a[href*='pos'], button:has-text('POS')");
    await expect(this.page.locator('h1, h2')).toContainText(/pos|point of sale|sales/i);
  }

  async searchProduct(productName) {
    await this.page.fill(this.productSearch, productName);
    await this.page.waitForTimeout(1000); // Wait for search results
  }

  async addProductToCart(productName, quantity = 1) {
    await this.searchProduct(productName);
    
    // Click on product or add to cart button
    const productCard = this.page.locator(`text=${productName}`).first();
    await productCard.click();
    
    // Set quantity if input is available
    const quantityInput = this.page.locator(this.quantityInput);
    if (await quantityInput.isVisible()) {
      await quantityInput.clear();
      await quantityInput.fill(quantity.toString());
    }
    
    // Add to cart
    const addButton = this.page.locator(this.addToCartButton);
    if (await addButton.isVisible()) {
      await addButton.click();
    }
  }

  async removeProductFromCart(productName) {
    const cartItem = this.page.locator(this.cartItems).filter({ hasText: productName });
    const removeButton = cartItem.locator(this.removeFromCartButton);
    await removeButton.click();
  }

  async updateProductQuantity(productName, newQuantity) {
    const cartItem = this.page.locator(this.cartItems).filter({ hasText: productName });
    const quantityInput = cartItem.locator(this.quantityInput);
    await quantityInput.clear();
    await quantityInput.fill(newQuantity.toString());
  }

  async selectCustomer(customerName) {
    const customerSelect = this.page.locator(this.customerSelect);
    if (await customerSelect.isVisible()) {
      await customerSelect.selectOption(customerName);
    }
  }

  async selectPaymentMethod(method) {
    const paymentSelect = this.page.locator(this.paymentMethodSelect);
    if (await paymentSelect.isVisible()) {
      await paymentSelect.selectOption(method);
    }
  }

  async applyDiscount(discountAmount) {
    const discountInput = this.page.locator(this.discountInput);
    if (await discountInput.isVisible()) {
      await discountInput.fill(discountAmount.toString());
    }
  }

  async proceedToCheckout() {
    await this.page.click(this.checkoutButton);
  }

  async completeSale(saleData = {}) {
    // Select customer if provided
    if (saleData.customer) {
      await this.selectCustomer(saleData.customer);
    }
    
    // Select payment method if provided
    if (saleData.paymentMethod) {
      await this.selectPaymentMethod(saleData.paymentMethod);
    }
    
    // Apply discount if provided
    if (saleData.discount) {
      await this.applyDiscount(saleData.discount);
    }
    
    // Complete the sale
    await this.page.click(this.confirmSaleButton);
    await this.verifySuccess();
  }

  async getTotalAmount() {
    const totalElement = this.page.locator(this.totalAmount);
    const totalText = await totalElement.textContent();
    return parseFloat(totalText.replace(/[^\d.]/g, ''));
  }

  async getCartItemCount() {
    const cartItems = await this.page.locator(this.cartItems).count();
    return cartItems;
  }

  async verifyProductInCart(productName) {
    await expect(this.page.locator(this.cart)).toContainText(productName);
  }

  async verifyProductNotInCart(productName) {
    await expect(this.page.locator(this.cart)).not.toContainText(productName);
  }

  async verifySuccess() {
    await expect(this.page.locator(this.successMessage)).toContainText(/success|completed|sale/i);
  }

  async printReceipt() {
    const printButton = this.page.locator(this.printReceiptButton);
    if (await printButton.isVisible()) {
      await printButton.click();
    }
  }

  async clearCart() {
    // Remove all items from cart
    const cartItems = await this.page.locator(this.cartItems).count();
    for (let i = 0; i < cartItems; i++) {
      const removeButton = this.page.locator(this.removeFromCartButton).first();
      if (await removeButton.isVisible()) {
        await removeButton.click();
        await this.page.waitForTimeout(500);
      }
    }
  }

  async verifyPOSPageLoaded() {
    await expect(this.page.locator('h1, h2')).toContainText(/pos|point of sale|sales/i);
    await expect(this.page.locator(this.productSearch)).toBeVisible();
    await expect(this.page.locator(this.cart)).toBeVisible();
  }
}

module.exports = { POSPage };
