-- =====================================================
-- TEST CLEAN AUTHENTICATION SYSTEM
-- =====================================================
-- This script tests and populates the clean auth system

-- First, let's verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Create test users (this will bypass RLS)
SELECT public.create_test_users();

-- Verify test users were created
SELECT 
    id,
    email,
    full_name,
    company,
    account_type,
    is_active,
    is_paid,
    trial_start_date,
    trial_end_date,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- Test the trial status logic
SELECT 
    email,
    full_name,
    account_type,
    is_paid,
    trial_end_date,
    CASE 
        WHEN is_paid = true OR account_type = 'admin' THEN 'PAID USER'
        WHEN trial_end_date > NOW() THEN 'ACTIVE TRIAL'
        WHEN trial_end_date <= NOW() THEN 'EXPIRED TRIAL'
        ELSE 'UNKNOWN'
    END as trial_status,
    CASE 
        WHEN trial_end_date > NOW() THEN EXTRACT(days FROM (trial_end_date - NOW()))
        ELSE 0
    END as days_left
FROM public.users
ORDER BY created_at DESC;
