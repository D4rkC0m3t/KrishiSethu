# Database Migration Instructions

## Problem
The POS component was sending `subtotal` and `discount` fields to Supabase, but these columns don't exist in the `sales` table, causing insertion errors.

## Solution Options

### Option 1: Keep Current Setup (Temporary Fix)
The POS code has been updated to skip sending `subtotal` and `discount` fields. This prevents database errors but means:
- ✅ POS works without errors
- ❌ No discount tracking in database
- ❌ No subtotal storage in database
- ❌ Reports/analytics missing discount data

### Option 2: Add Missing Columns (Recommended)

#### Step 1: Run Database Migration
1. Open Supabase Dashboard → SQL Editor
2. Run the migration script from `migrations/add_subtotal_discount_to_sales.sql`:

```sql
-- Add the missing columns to the sales table
ALTER TABLE sales 
ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00;

-- Add comments to document the columns
COMMENT ON COLUMN sales.subtotal IS 'Subtotal amount before discount and tax';
COMMENT ON COLUMN sales.discount IS 'Total discount amount applied to the sale';

-- Update existing records to calculate subtotal from total_amount and tax_amount
UPDATE sales 
SET subtotal = COALESCE(total_amount - tax_amount, total_amount)
WHERE subtotal IS NULL OR subtotal = 0;

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND column_name IN ('subtotal', 'discount')
ORDER BY column_name;
```

#### Step 2: Update POS Code
In `src/components/POS.jsx`, uncomment these lines (around line 870):

```javascript
// Change from:
// NOTE: Uncomment these after running the database migration
// subtotal: Number(subtotal.toFixed(2)),
// discount: Number(discountAmount.toFixed(2)),

// To:
subtotal: Number(subtotal.toFixed(2)),
discount: Number(discountAmount.toFixed(2)),
```

#### Step 3: Test
1. Restart your application
2. Make a test sale with discount
3. Verify data appears correctly in Sales History
4. Check Supabase dashboard to confirm data is stored

## Benefits of Option 2
- ✅ Full discount tracking for business analytics
- ✅ Proper GST compliance with itemized discounts
- ✅ Better reporting capabilities
- ✅ Customer purchase history with discounts
- ✅ Audit trail for discount reasons

## Migration Status
- [x] Migration script created
- [ ] Migration executed in Supabase
- [ ] POS code updated to send subtotal/discount
- [ ] Testing completed

## Rollback Plan
If issues occur after migration:

```sql
-- Remove the columns if needed
ALTER TABLE sales 
DROP COLUMN IF EXISTS subtotal,
DROP COLUMN IF EXISTS discount;
```

Then revert the POS code changes.

---

**Recommendation:** Use Option 2 for a complete solution that supports your business requirements for discount tracking and GST compliance.
