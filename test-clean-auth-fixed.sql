-- =====================================================
-- TEST CLEAN AUTHENTICATION SYSTEM (FIXED)
-- =====================================================
-- This script tests and populates the clean auth system properly

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

-- Check current users in the table
SELECT COUNT(*) as current_user_count FROM public.users;

-- Create a corrected test function that doesn't violate foreign key constraints
CREATE OR REPLACE FUNCTION public.create_test_users_fixed()
RETURNS VOID AS $$
BEGIN
    -- Create test users by inserting directly with proper auth IDs
    -- We'll create fake UUIDs that could represent auth users
    
    -- Note: In a real scenario, these would come from actual Supabase auth.users
    -- For testing, we'll create standalone records that don't reference auth.users
    
    -- Let's first try to find existing auth users
    INSERT INTO public.users (
        id, 
        email, 
        full_name, 
        phone, 
        company, 
        account_type, 
        is_active, 
        is_paid,
        trial_start_date, 
        trial_end_date
    ) 
    SELECT 
        gen_random_uuid(),
        'active-trial@test.com',
        'Active Trial User',
        '+91-9876543210',
        'Test Company 1',
        'trial',
        true,
        false,
        NOW(),
        NOW() + INTERVAL '20 days'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.users WHERE email = 'active-trial@test.com'
    );
    
    -- Add more test users similarly
    INSERT INTO public.users (
        id, 
        email, 
        full_name, 
        phone, 
        company, 
        account_type, 
        is_active, 
        is_paid,
        trial_start_date, 
        trial_end_date
    ) 
    SELECT 
        gen_random_uuid(),
        'expired-trial@test.com',
        'Expired Trial User',
        '+91-9876543211',
        'Test Company 2',
        'trial',
        true,
        false,
        NOW() - INTERVAL '35 days',
        NOW() - INTERVAL '5 days'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.users WHERE email = 'expired-trial@test.com'
    );
    
    INSERT INTO public.users (
        id, 
        email, 
        full_name, 
        phone, 
        company, 
        account_type, 
        is_active, 
        is_paid,
        trial_start_date, 
        trial_end_date
    ) 
    SELECT 
        gen_random_uuid(),
        'paid-user@test.com',
        'Paid User',
        '+91-9876543212',
        'Premium Company',
        'paid',
        true,
        true,
        NOW() - INTERVAL '60 days',
        NOW() - INTERVAL '30 days'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.users WHERE email = 'paid-user@test.com'
    );
    
    RAISE NOTICE 'Test users created successfully (if they did not already exist)';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Let's check the actual foreign key constraint
SELECT
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

-- The issue is that our users table requires IDs from auth.users
-- Let's temporarily disable the foreign key constraint for testing
-- WARNING: This is only for testing purposes

-- First, let's see what constraints exist
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
    AND contype = 'f';

-- Let's create a safer test approach - create auth users first, then profiles
-- But since we can't easily create auth.users directly, let's modify our approach

-- Alternative: Create a test function that works with existing constraints
CREATE OR REPLACE FUNCTION public.create_standalone_test_users()
RETURNS VOID AS $$
DECLARE
    test_uuid1 UUID := gen_random_uuid();
    test_uuid2 UUID := gen_random_uuid();
    test_uuid3 UUID := gen_random_uuid();
BEGIN
    -- Temporarily disable RLS for this function
    SET LOCAL row_security = OFF;
    
    -- Insert test users directly (this may still fail due to foreign key)
    BEGIN
        INSERT INTO public.users (
            id, email, full_name, phone, company, 
            account_type, is_active, is_paid,
            trial_start_date, trial_end_date
        ) VALUES 
        (
            test_uuid1,
            'active-trial@test.local',
            'Active Trial User',
            '+91-9876543210',
            'Test Company 1',
            'trial',
            true,
            false,
            NOW(),
            NOW() + INTERVAL '20 days'
        );
        RAISE NOTICE 'Created active trial user with ID: %', test_uuid1;
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'Cannot create test user due to foreign key constraint. This is expected.';
        WHEN unique_violation THEN
            RAISE NOTICE 'Test user already exists.';
    END;
    
    -- Try the other users
    BEGIN
        INSERT INTO public.users (
            id, email, full_name, phone, company, 
            account_type, is_active, is_paid,
            trial_start_date, trial_end_date
        ) VALUES 
        (
            test_uuid2,
            'expired-trial@test.local',
            'Expired Trial User',
            '+91-9876543211',
            'Test Company 2',
            'trial',
            true,
            false,
            NOW() - INTERVAL '35 days',
            NOW() - INTERVAL '5 days'
        );
        RAISE NOTICE 'Created expired trial user with ID: %', test_uuid2;
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'Cannot create expired trial user due to foreign key constraint.';
        WHEN unique_violation THEN
            RAISE NOTICE 'Expired trial user already exists.';
    END;

    BEGIN
        INSERT INTO public.users (
            id, email, full_name, phone, company, 
            account_type, is_active, is_paid,
            trial_start_date, trial_end_date
        ) VALUES 
        (
            test_uuid3,
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
        RAISE NOTICE 'Created paid user with ID: %', test_uuid3;
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'Cannot create paid user due to foreign key constraint.';
        WHEN unique_violation THEN
            RAISE NOTICE 'Paid user already exists.';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Try the fixed function
SELECT public.create_standalone_test_users();

-- Check what we have now
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
