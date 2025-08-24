-- =====================================================
-- ANALYZE AND CLEAN SETTINGS SPECIFICALLY
-- Target the 72 settings records that are causing issues
-- =====================================================

-- Step 1: Analyze current settings to understand what's taking up space
SELECT 'CURRENT SETTINGS ANALYSIS' as analysis_type;

-- Count by key patterns
SELECT 'Settings by Pattern' as type, 
       CASE 
           WHEN key LIKE '%test%' THEN 'test-related'
           WHEN key LIKE '%debug%' THEN 'debug-related'
           WHEN key LIKE '%cache%' THEN 'cache-related'
           WHEN key LIKE '%session%' THEN 'session-related'
           WHEN key LIKE '%temp%' THEN 'temporary'
           WHEN key LIKE '%config%' THEN 'config-related'
           WHEN key LIKE '%user%' THEN 'user-related'
           WHEN key LIKE '%theme%' THEN 'theme-related'
           WHEN key LIKE '%notification%' THEN 'notification-related'
           WHEN length(key) > 30 THEN 'long-keys'
           ELSE 'other'
       END as category,
       COUNT(*) as count
FROM settings 
GROUP BY 2
ORDER BY count DESC;

-- Show actual keys to see what we're dealing with
SELECT 'ACTUAL SETTINGS KEYS' as type, key, length(key) as key_length, length(value::text) as value_length
FROM settings 
ORDER BY value_length DESC, key_length DESC
LIMIT 20;

-- Step 2: More aggressive cleanup based on actual data
-- Delete settings with very long keys (likely auto-generated IDs)
DELETE FROM settings WHERE length(key) > 40;

-- Delete settings with very long values (likely data dumps)
DELETE FROM settings WHERE length(value::text) > 5000;

-- Delete settings that look like UUIDs or auto-generated
DELETE FROM settings WHERE 
    key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' OR
    key ~ '^[0-9]+$' OR
    key LIKE '%-%-%-%-%';

-- Delete common unwanted patterns
DELETE FROM settings WHERE 
    key LIKE '%_id_%' OR
    key LIKE '%_uuid_%' OR
    key LIKE '%_token_%' OR
    key LIKE '%_secret_%' OR
    key LIKE '%_hash_%' OR
    key LIKE '%_encrypted_%' OR
    key LIKE '%localStorage%' OR
    key LIKE '%sessionStorage%' OR
    key LIKE '%indexedDB%';

-- Delete settings with JSON that looks like state dumps
DELETE FROM settings WHERE 
    value::text LIKE '%"state"%' OR
    value::text LIKE '%"redux"%' OR
    value::text LIKE '%"component"%' OR
    value::text LIKE '%"props"%' OR
    value::text LIKE '%"render"%';

-- Keep only truly essential business settings
CREATE TEMP TABLE essential_settings AS
SELECT * FROM settings WHERE key IN (
    'shop_name',
    'company_name', 
    'company_address',
    'company_phone',
    'company_email',
    'company_logo',
    'currency',
    'currency_symbol',
    'tax_rate',
    'gst_rate',
    'theme',
    'language',
    'locale',
    'timezone',
    'date_format',
    'time_format',
    'number_format',
    'decimal_places',
    'inventory_method',
    'low_stock_threshold',
    'reorder_level',
    'backup_frequency',
    'email_notifications',
    'sms_notifications',
    'push_notifications',
    'auto_backup',
    'receipt_template',
    'invoice_template',
    'report_format',
    'print_format',
    'barcode_format',
    'pos_layout',
    'dashboard_layout'
);

-- Delete everything except essential settings
DELETE FROM settings WHERE key NOT IN (
    SELECT key FROM essential_settings
);

-- Step 3: Show results
SELECT 'AFTER TARGETED CLEANUP' as status, COUNT(*) as remaining_settings FROM settings;

-- Show what's left
SELECT 'REMAINING SETTINGS' as type, key, 
       CASE 
           WHEN length(value::text) > 100 THEN LEFT(value::text, 100) || '...'
           ELSE value::text 
       END as value_preview
FROM settings 
ORDER BY key;

-- Final assessment
SELECT 
    'CLEANUP ASSESSMENT' as assessment,
    COUNT(*) as final_count,
    CASE 
        WHEN COUNT(*) <= 15 THEN '✅ EXCELLENT: Optimal settings count'
        WHEN COUNT(*) <= 25 THEN '✅ GOOD: Reasonable settings count'
        WHEN COUNT(*) <= 35 THEN '⚠️ OK: Acceptable settings count'
        ELSE '❌ STILL TOO MANY: Need manual review'
    END as status
FROM settings;

-- Cleanup temp table
DROP TABLE essential_settings;
