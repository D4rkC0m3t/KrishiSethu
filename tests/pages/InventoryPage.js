// tests/pages/InventoryPage.js
const { expect } = require('@playwright/test');

class InventoryPage {
  constructor(page) {
    this.page = page;
    
    // Selectors
    this.addProductButton = "text=Add Product, button:has-text('Add Product')";
    this.searchBox = "input[placeholder*='search'], input[name='search'], #search";
    this.productTable = "table, .product-list, .inventory-grid";
    this.editButton = "button:has-text('Edit'), .edit-btn, [data-action='edit']";
    this.deleteButton = "button:has-text('Delete'), .delete-btn, [data-action='delete']";
    this.confirmDeleteButton = "button:has-text('Confirm'), button:has-text('Yes'), button:has-text('Delete')";
    this.successMessage = ".toast, .alert, .notification";
    
    // Form selectors
    this.productNameField = "input[name='name'], #productName, input[placeholder*='name']";
    this.productCodeField = "input[name='code'], #productCode, input[placeholder*='code']";
    this.categorySelect = "select[name='category'], #category";
    this.brandSelect = "select[name='brand'], #brand";
    this.quantityField = "input[name='quantity'], #quantity, input[placeholder*='quantity']";
    this.priceField = "input[name='price'], #price, input[placeholder*='price']";
    this.costPriceField = "input[name='costPrice'], #costPrice";
    this.gstField = "input[name='gst'], #gst, input[placeholder*='gst']";
    this.hsnField = "input[name='hsn'], #hsn";
    this.descriptionField = "textarea[name='description'], #description";
    this.saveButton = "button[type='submit'], button:has-text('Save'), button:has-text('Add Product')";
    this.updateButton = "button:has-text('Update'), button:has-text('Save'), button[type='submit']";
  }

  async goto() {
    await this.page.click("text=Inventory, a[href*='inventory'], button:has-text('Inventory')");
    await expect(this.page.locator('h1, h2')).toContainText(/inventory|products/i);
  }

  async clickAddProduct() {
    await this.page.click(this.addProductButton);
  }

  async fillProductForm(productData) {
    await this.page.fill(this.productNameField, productData.name);
    await this.page.fill(this.productCodeField, productData.code);
    
    // Select category if dropdown exists
    const categorySelect = this.page.locator(this.categorySelect);
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption(productData.category);
    }
    
    // Select brand if dropdown exists
    const brandSelect = this.page.locator(this.brandSelect);
    if (await brandSelect.isVisible()) {
      await brandSelect.selectOption(productData.brand);
    }
    
    await this.page.fill(this.quantityField, productData.quantity);
    await this.page.fill(this.priceField, productData.price);
    
    // Fill optional fields if they exist
    const costPriceField = this.page.locator(this.costPriceField);
    if (await costPriceField.isVisible() && productData.costPrice) {
      await costPriceField.fill(productData.costPrice);
    }
    
    const gstField = this.page.locator(this.gstField);
    if (await gstField.isVisible() && productData.gst) {
      await gstField.fill(productData.gst);
    }
    
    const hsnField = this.page.locator(this.hsnField);
    if (await hsnField.isVisible() && productData.hsn) {
      await hsnField.fill(productData.hsn);
    }
    
    const descriptionField = this.page.locator(this.descriptionField);
    if (await descriptionField.isVisible() && productData.description) {
      await descriptionField.fill(productData.description);
    }
  }

  async saveProduct() {
    await this.page.click(this.saveButton);
  }

  async updateProduct() {
    await this.page.click(this.updateButton);
  }

  async addProduct(productData) {
    await this.clickAddProduct();
    await this.fillProductForm(productData);
    await this.saveProduct();
    await this.verifySuccess();
  }

  async searchProduct(productName) {
    await this.page.fill(this.searchBox, productName);
    await this.page.waitForTimeout(1000); // Wait for search results
  }

  async editProduct(productName, newData) {
    await this.searchProduct(productName);
    await this.page.click(this.editButton);
    
    // Update specific fields
    if (newData.quantity) {
      await this.page.fill(this.quantityField, newData.quantity);
    }
    if (newData.price) {
      await this.page.fill(this.priceField, newData.price);
    }
    
    await this.updateProduct();
    await this.verifySuccess();
  }

  async deleteProduct(productName) {
    await this.searchProduct(productName);
    await this.page.click(this.deleteButton);
    await this.page.click(this.confirmDeleteButton);
    await this.verifySuccess();
  }

  async verifyProductExists(productName) {
    await this.searchProduct(productName);
    await expect(this.page.locator(this.productTable)).toContainText(productName);
  }

  async verifyProductNotExists(productName) {
    await this.searchProduct(productName);
    await expect(this.page.locator(this.productTable)).not.toContainText(productName);
  }

  async verifySuccess() {
    await expect(this.page.locator(this.successMessage)).toContainText(/success|added|updated|deleted|created/i);
  }

  async getProductCount() {
    const rows = await this.page.locator('table tbody tr, .product-item').count();
    return rows;
  }

  async verifyInventoryPageLoaded() {
    await expect(this.page.locator('h1, h2')).toContainText(/inventory|products/i);
    await expect(this.page.locator(this.addProductButton)).toBeVisible();
  }
}

module.exports = { InventoryPage };
