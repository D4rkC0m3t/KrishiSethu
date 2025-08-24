# Fix for AddProduct.jsx - Category/Brand ID Issues

## Problem
The AddProduct form creates category IDs like "cat_7" but the database expects UUID format for category_id and brand_id columns.

## Solution Options

### Option 1: Quick Fix (Recommended)
Modify the handleSubmit function in AddProduct.jsx to send NULL for UUID fields and use text fields instead:

```javascript
// Around line 921-922, change:
category_id: formData.categoryId, // This sends "cat_7" 
brand_id: formData.brandId,       // This might send non-UUID

// To:
category_id: null,  // Don't try to use fake UUIDs
brand_id: null,     // Don't try to use fake UUIDs
category: selectedCategory?.name || formData.category || '', // Use text field
brand: selectedBrand?.name || formData.brand || '',         // Use text field
```

### Option 2: Better Fix (For later)
1. Modify the loadCategories function to use real database UUIDs
2. Update the form to work with proper UUID relationships

## Immediate Steps
1. Run the SQL fix script: `FIX-PRODUCT-FORM-IDS.sql` 
2. Make the code change in AddProduct.jsx
3. Test product creation

## Code Change Location
File: `src/components/AddProduct.jsx`
Lines: Around 921-922 in the handleSubmit function
