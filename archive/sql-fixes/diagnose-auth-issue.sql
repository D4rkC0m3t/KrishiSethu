-- Diagnostic script to check the current state of auth.users table
-- Run this first to understand the current situation

-- 1. Check if auth.users table exists and what columns it has
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check current users and their token field status
SELECT 
    email,
    created_at,
    CASE 
        WHEN confirmation_token IS NULL THEN 'NULL'
        WHEN confirmation_token = '' THEN 'EMPTY'
        ELSE 'HAS_VALUE'
    END as confirmation_token_status,
    CASE 
        WHEN recovery_token IS NULL THEN 'NULL'
        WHEN recovery_token = '' THEN 'EMPTY'
        ELSE 'HAS_VALUE'
    END as recovery_token_status,
    CASE 
        WHEN email_change_token_new IS NULL THEN 'NULL'
        WHEN email_change_token_new = '' THEN 'EMPTY'
        ELSE 'HAS_VALUE'
    END as email_change_token_new_status
FROM auth.users
ORDER BY created_at;

-- 3. Count problematic records
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_tokens,
    COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as null_recovery_tokens,
    COUNT(CASE WHEN email_change_token_new IS NULL THEN 1 END) as null_email_change_tokens,
    COUNT(CASE WHEN email_change_token_current IS NULL THEN 1 END) as null_email_change_current_tokens,
    COUNT(CASE WHEN email_change IS NULL THEN 1 END) as null_email_change
FROM auth.users;

-- 4. Check table constraints
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'auth' AND table_name = 'users';