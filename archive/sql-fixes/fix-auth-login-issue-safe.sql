-- SAFE fix for Supabase Auth login issue: "Database error querying schema"
-- This addresses: https://github.com/supabase/auth/issues/1940
-- Run each section separately and check results

-- STEP 1: Update existing NULL token values to empty strings
-- This fixes existing users that can't log in
UPDATE auth.users 
SET 
  confirmation_token = ''
WHERE confirmation_token IS NULL;

UPDATE auth.users 
SET 
  recovery_token = ''
WHERE recovery_token IS NULL;

UPDATE auth.users 
SET 
  email_change_token_new = ''
WHERE email_change_token_new IS NULL;

UPDATE auth.users 
SET 
  email_change_token_current = ''
WHERE email_change_token_current IS NULL;

UPDATE auth.users 
SET 
  email_change = ''
WHERE email_change IS NULL;

-- STEP 2: Verify the fix worked
SELECT 
    email,
    CASE 
        WHEN confirmation_token IS NULL THEN 'NULL (PROBLEM!)'
        WHEN confirmation_token = '' THEN 'EMPTY (FIXED)'
        ELSE 'HAS_VALUE'
    END as confirmation_token_status,
    CASE 
        WHEN recovery_token IS NULL THEN 'NULL (PROBLEM!)'
        WHEN recovery_token = '' THEN 'EMPTY (FIXED)'
        ELSE 'HAS_VALUE'
    END as recovery_token_status,
    CASE 
        WHEN email_change_token_new IS NULL THEN 'NULL (PROBLEM!)'
        WHEN email_change_token_new = '' THEN 'EMPTY (FIXED)'
        ELSE 'HAS_VALUE'
    END as email_change_token_new_status
FROM auth.users
ORDER BY created_at;

-- STEP 3: Set default values for future users (optional but recommended)
-- Only run this if you have superuser privileges
-- ALTER TABLE auth.users ALTER COLUMN confirmation_token SET DEFAULT '';
-- ALTER TABLE auth.users ALTER COLUMN recovery_token SET DEFAULT '';
-- ALTER TABLE auth.users ALTER COLUMN email_change_token_new SET DEFAULT '';
-- ALTER TABLE auth.users ALTER COLUMN email_change_token_current SET DEFAULT '';
-- ALTER TABLE auth.users ALTER COLUMN email_change SET DEFAULT '';

-- STEP 4: Final verification - count problematic records (should be 0)
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as remaining_null_confirmation_tokens,
    COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as remaining_null_recovery_tokens,
    COUNT(CASE WHEN email_change_token_new IS NULL THEN 1 END) as remaining_null_email_change_tokens
FROM auth.users;