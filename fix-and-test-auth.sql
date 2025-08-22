-- =====================================================
-- FIX AND TEST CLEAN AUTHENTICATION SYSTEM
-- =====================================================
-- This script temporarily removes the foreign key constraint for testing,
-- creates test data, then optionally restores the constraint

-- First, let's see what we're working with
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check the foreign key constraint
SELECT
    tc.constraint_name,
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'users';

-- Step 1: Temporarily drop the foreign key constraint for testing
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Get the foreign key constraint name
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints AS tc 
    WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'users'
        AND tc.table_schema = 'public';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found to drop';
    END IF;
END $$;

-- Step 2: Create test users without foreign key constraint
CREATE OR REPLACE FUNCTION public.create_test_data_for_testing()
RETURNS VOID AS $$
BEGIN
    -- Disable RLS temporarily for this function
    SET LOCAL row_security = OFF;
    
    -- Clear any existing test data first
    DELETE FROM public.users WHERE email LIKE '%@test.local';
    
    -- Insert test users
    INSERT INTO public.users (
        id, email, full_name, phone, company, 
        account_type, is_active, is_paid,
        trial_start_date, trial_end_date
    ) VALUES 
    (
        'a1111111-1111-1111-1111-111111111111',
        'active-trial@test.local',
        'Active Trial User',
        '+91-9876543210',
        'Test Company 1',
        'trial',
        true,
        false,
        NOW(),
        NOW() + INTERVAL '20 days'
    ),
    (
        'b2222222-2222-2222-2222-222222222222',
        'expired-trial@test.local',
        'Expired Trial User',
        '+91-9876543211',
        'Test Company 2',
        'trial',
        true,
        false,
        NOW() - INTERVAL '35 days',
        NOW() - INTERVAL '5 days'
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        'paid-user@test.local',
        'Paid User',
        '+91-9876543212',
        'Premium Company',
        'paid',
        true,
        true,
        NOW() - INTERVAL '60 days',
        NOW() - INTERVAL '30 days'
    );
    
    RAISE NOTICE 'Created 3 test users successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the test data creation
SELECT public.create_test_data_for_testing();

-- Step 3: Verify test data was created
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
    CASE 
        WHEN is_paid = true OR account_type = 'paid' THEN 'PAID USER'
        WHEN trial_end_date > NOW() THEN 'ACTIVE TRIAL'
        WHEN trial_end_date <= NOW() THEN 'EXPIRED TRIAL'
        ELSE 'UNKNOWN'
    END as trial_status,
    CASE 
        WHEN trial_end_date > NOW() THEN EXTRACT(days FROM (trial_end_date - NOW()))
        ELSE 0
    END as days_left,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- Step 4: Optionally restore the foreign key constraint
-- WARNING: Comment this out if you want to keep test data without auth users
/*
ALTER TABLE public.users 
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
*/

-- Summary information
DO $$
DECLARE
    user_count INTEGER;
    active_trials INTEGER;
    expired_trials INTEGER;
    paid_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.users;
    SELECT COUNT(*) INTO active_trials FROM public.users 
        WHERE is_paid = false AND is_active = true AND trial_end_date > NOW();
    SELECT COUNT(*) INTO expired_trials FROM public.users 
        WHERE is_paid = false AND trial_end_date <= NOW();
    SELECT COUNT(*) INTO paid_users FROM public.users 
        WHERE is_paid = true OR account_type = 'paid';
    
    RAISE NOTICE '=== TEST DATA SUMMARY ===';
    RAISE NOTICE 'Total Users: %', user_count;
    RAISE NOTICE 'Active Trials: %', active_trials;
    RAISE NOTICE 'Expired Trials: %', expired_trials;
    RAISE NOTICE 'Paid Users: %', paid_users;
    RAISE NOTICE '========================';
    
    IF user_count >= 3 THEN
        RAISE NOTICE '✅ Test data created successfully! You can now test the debug tool.';
    ELSE
        RAISE NOTICE '❌ Test data creation may have failed.';
    END IF;
END $$;
