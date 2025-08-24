-- =====================================================
-- TARGETED SETTINGS CLEANUP V2
-- Reduce 72 settings to ~10-15 essential ones
-- =====================================================

-- Step 1: See what we currently have
SELECT 'BEFORE CLEANUP' as status, COUNT(*) as total FROM settings;

-- Show sample of current settings
SELECT 'SAMPLE CURRENT SETTINGS' as info, 
       key, 
       length(key) as key_len,
       length(value::text) as val_len,
       LEFT(value::text, 50) as value_sample
FROM settings 
ORDER BY length(value::text) DESC
LIMIT 10;

-- Step 2: Nuclear approach - delete everything except core business settings
DELETE FROM settings WHERE key NOT IN (
    'company_name',
    'company_address', 
    'company_phone',
    'company_email',
    'currency',
    'tax_rate',
    'theme',
    'language',
    'timezone',
    'low_stock_threshold',
    'backup_enabled',
    'notifications_enabled'
);

-- Step 3: Delete any remaining junk patterns
DELETE FROM settings WHERE 
    length(key) > 50 OR
    key LIKE '%-%-%' OR
    key ~ '[0-9]{8,}' OR
    value::text LIKE '%{%"%}%' OR
    length(value::text) > 1000;

-- Step 4: Results
SELECT 'AFTER CLEANUP' as status, COUNT(*) as total FROM settings;

-- Show what remains
SELECT 'REMAINING SETTINGS' as info, 
       key,
       value::text as value
FROM settings 
ORDER BY key;

-- Final check
SELECT 
    CASE 
        WHEN COUNT(*) <= 20 THEN '✅ SUCCESS - Settings optimized'
        ELSE '⚠️ REVIEW NEEDED - Still too many'
    END as result,
    COUNT(*) as final_count
FROM settings;
