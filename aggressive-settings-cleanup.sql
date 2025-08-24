-- =====================================================
-- AGGRESSIVE SETTINGS CLEANUP
-- Reduces settings from 93 to reasonable levels (~20-30)
-- =====================================================

-- Before cleanup - see what we have
SELECT 'BEFORE AGGRESSIVE CLEANUP' as status, COUNT(*) as total FROM settings;

-- Show top settings by frequency
SELECT 'Top Settings by Key' as info, key, COUNT(*) as count 
FROM settings 
GROUP BY key 
ORDER BY count DESC 
LIMIT 10;

-- 1. Delete all test/debug/temporary settings
DELETE FROM settings WHERE 
    key LIKE '%test%' OR
    key LIKE '%debug%' OR
    key LIKE '%temp%' OR
    key LIKE '%cache%' OR
    key LIKE '%session%' OR
    key LIKE '%demo%' OR
    key LIKE '%sample%' OR
    key LIKE '%example%' OR
    key LIKE '%mock%' OR
    key LIKE '%fake%';

-- 2. Delete settings with empty or null values
DELETE FROM settings WHERE 
    value IS NULL OR
    value::text = '{}' OR
    value::text = '[]' OR
    value::text = '""' OR
    value::text = 'null' OR
    value::text = '';

-- 3. Delete duplicate settings (keep only the most recent)
DELETE FROM settings s1
USING settings s2
WHERE s1.id < s2.id
AND s1.key = s2.key;

-- 4. Delete old settings (older than 3 months)
DELETE FROM settings WHERE created_at < NOW() - INTERVAL '3 months';

-- 5. Delete settings that are clearly system/framework artifacts
DELETE FROM settings WHERE 
    key LIKE 'next%' OR
    key LIKE 'react%' OR
    key LIKE 'webpack%' OR
    key LIKE 'babel%' OR
    key LIKE 'eslint%' OR
    key LIKE 'prettier%' OR
    key LIKE 'node%' OR
    key LIKE 'npm%' OR
    key LIKE 'yarn%';

-- 6. Delete settings with very long keys (likely auto-generated)
DELETE FROM settings WHERE length(key) > 50;

-- 7. Delete settings with very large values (likely dumps)
DELETE FROM settings WHERE length(value::text) > 10000;

-- 8. Keep only essential settings - delete non-essential ones
-- This is aggressive but necessary for performance
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
    'date_format',
    'number_format',
    'inventory_method',
    'low_stock_threshold',
    'backup_frequency',
    'email_notifications',
    'sms_notifications',
    'auto_backup',
    'receipt_template',
    'invoice_template',
    'report_format'
);

-- After cleanup results
SELECT 'AFTER AGGRESSIVE CLEANUP' as status, COUNT(*) as total FROM settings;

-- Show remaining settings
SELECT 'REMAINING SETTINGS' as info, key, value::text as value_preview 
FROM settings 
ORDER BY key;

-- Final summary
SELECT 
    CASE 
        WHEN COUNT(*) <= 30 THEN 'SUCCESS: Settings optimized'
        WHEN COUNT(*) <= 50 THEN 'GOOD: Settings reduced significantly' 
        ELSE 'WARNING: Still too many settings'
    END as cleanup_result,
    COUNT(*) as final_count
FROM settings;
