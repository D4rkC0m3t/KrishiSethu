-- Simple check for admin functions - one query at a time

-- Check 1: Does admin_roles table exist?
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'admin_roles'
        ) THEN 'admin_roles table EXISTS ✅'
        ELSE 'admin_roles table MISSING ❌'
    END AS admin_table_status;
