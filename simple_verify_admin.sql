-- Simple Admin Verification - Avoiding JSON Syntax Issues

-- 1. Check if the email exists in auth.users
SELECT 
    'Auth User Check' AS check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'arjunin2020@gmail.com')
        THEN 'Email exists in auth.users ✅'
        ELSE 'Email NOT found in auth.users ❌'
    END AS status;
