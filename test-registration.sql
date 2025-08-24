-- Test script to verify user registration is working
-- Run this in your Supabase SQL Editor

-- 1. Check if users table exists and its structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if there are any users in the table
SELECT COUNT(*) as user_count FROM users;

-- 3. Check the last few users (if any exist)
SELECT id, email, name, role, account_type, is_active, trial_start_date, trial_end_date, created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 5. Create a test user record (if the table exists but registration isn't working)
-- Uncomment this section only if needed:
/*
INSERT INTO users (
    id, 
    email, 
    name, 
    role, 
    account_type, 
    is_active, 
    is_paid, 
    trial_start_date, 
    trial_end_date,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'test@example.com',
    'Test User',
    'trial',
    'trial',
    true,
    false,
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
*/
