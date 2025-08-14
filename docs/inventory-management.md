# Inventory Management Guide

Complete guide to managing your agricultural products inventory in KrishiSethu.

## Overview

The Inventory Management system helps you:
- Track all your agricultural products
- Monitor stock levels in real-time
- Set up automated alerts
- Manage categories and brands
- Handle batch tracking and expiry dates

## Adding Products

### Single Product Entry

#### Step 1: Navigate to Add Product
1. Click "Inventory" in the sidebar
2. Click the "Add Product" button (+ icon)
3. The Add Product form will open

#### Step 2: Fill Product Information

**Basic Details**
- **Product Name**: Enter the full product name (e.g., "Urea Fertilizer 50kg")
- **Category**: Select from dropdown (Fertilizers, Seeds, Pesticides, etc.)
- **Brand**: Choose the manufacturer brand
- **Description**: Add detailed product description

**Pricing Information**
- **Purchase Price**: Cost price from supplier
- **Selling Price**: Retail price for customers
- **MRP**: Maximum Retail Price (if applicable)
- **Tax Rate**: GST percentage (usually 5% for fertilizers)

**Stock Information**
- **Initial Quantity**: Starting stock amount
- **Unit**: Measurement unit (kg, bags, liters, etc.)
- **Reorder Point**: Minimum stock level for alerts
- **Reorder Quantity**: Suggested reorder amount

**Additional Information**
- **HSN Code**: For GST compliance
- **Batch Number**: If tracking batches
- **Expiry Date**: For products with expiration
- **Supplier**: Primary supplier information

#### Step 3: Save the Product
1. Review all information
2. Click "Save Product"
3. Product will appear in inventory list

### Bulk Product Entry

#### Using Bulk Add Table
1. Go to Inventory → "Bulk Add"
2. Use the table to add multiple products at once
3. Fill each row with product details
4. Click "Save All Products"

#### Using CSV Import
1. Download the CSV template
2. Fill the template with your products
3. Upload the completed CSV file
4. Review and confirm the import

## Stock Management

### Viewing Stock Levels
- **Current Stock**: Real-time quantities
- **Stock Status**: Color-coded indicators
  - 🟢 Green: Good stock (above reorder point)
  - 🟡 Yellow: Low stock (at reorder point)
  - 🔴 Red: Out of stock (zero quantity)

### Stock Adjustments

#### When to Adjust Stock
- Physical count differences
- Damaged goods
- Theft or loss
- Supplier returns
- Promotional giveaways

#### How to Adjust Stock
1. Go to Inventory → Select product
2. Click "Adjust Stock"
3. Enter new quantity or adjustment amount
4. Add reason for adjustment
5. Save the adjustment

### Stock Movements Tracking
The system automatically tracks:
- **Sales**: Automatic reduction from POS
- **Purchases**: Manual stock additions
- **Adjustments**: Manual corrections
- **Returns**: Customer/supplier returns
- **Damage/Loss**: Stock write-offs

## Categories and Brands

### Default Categories
- **Fertilizers**: NPK, Urea, DAP, Organic fertilizers
- **Seeds**: Vegetable seeds, Crop seeds, Flower seeds
- **Pesticides**: Insecticides, Fungicides, Herbicides
- **Tools**: Farming equipment and tools
- **Others**: Miscellaneous agricultural products

### Creating New Categories
1. Go to Settings → "Categories Management"
2. Click "Add Category"
3. Enter category name and description
4. Save the new category

### Managing Brands
1. Go to Settings → "Brands Management"
2. Add new brands as needed
3. Associate products with brands
4. Track brand performance

## Alerts and Notifications

### Low Stock Alerts
1. Set reorder points for each product
2. System automatically generates alerts
3. View alerts in Dashboard or Alerts panel
4. Take action: reorder or adjust levels

### Expiry Alerts
- Monitor products approaching expiry
- Get alerts 30, 7, and 1 day before expiry
- Take action: discount pricing or return to supplier

### Setting Up Alerts
1. Go to product details
2. Set "Reorder Point" (e.g., 10 units)
3. Set "Reorder Quantity" (e.g., 50 units)
4. Enable "Auto Reorder" if desired

## Batch Management

### Tracking Batches
- Assign batch numbers to products
- Track expiry dates per batch
- Monitor batch-wise stock levels
- FIFO (First In, First Out) management

### Adding New Batches
1. Select product in inventory
2. Click "Add Batch"
3. Enter batch details:
   - Batch number
   - Quantity
   - Expiry date
   - Supplier
   - Cost price
4. Save batch information

## Best Practices

### Naming Convention
- Use descriptive names: "NPK 19:19:19 Fertilizer 50kg"
- Include size/weight in the name
- Be consistent across similar products

### Pricing Strategy
- Set competitive selling prices
- Include all costs in purchase price
- Regular price reviews and updates

### Stock Management
- Set appropriate reorder points
- Monitor fast-moving vs slow-moving items
- Regular stock audits and adjustments

### Regular Maintenance
- Conduct monthly physical counts
- Compare with system quantities
- Investigate and resolve discrepancies
- Update reorder points based on sales patterns

## Reports

### Available Reports
- **Current Stock Report**: All products with quantities
- **Low Stock Report**: Products below reorder point
- **Stock Movement Report**: All stock transactions
- **Expiry Report**: Products approaching expiry
- **Stock Valuation Report**: Total inventory value

### Generating Reports
1. Go to Reports section
2. Select report type
3. Choose date range (if applicable)
4. Click "Generate Report"
5. Export to PDF or Excel if needed

## Troubleshooting

### Common Issues
- **Product not found**: Check spelling, try partial names
- **Stock discrepancies**: Verify recent transactions
- **Import errors**: Check CSV format and data

### Getting Help
- Check this documentation
- Contact support team
- Use the built-in help system
- Watch video tutorials
