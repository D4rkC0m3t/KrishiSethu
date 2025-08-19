-- Verify and create admin user if needed
-- Run this in Supabase SQL Editor

-- 1. Check if admin user exists
SELECT 
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data->>'name' as name
FROM auth.users 
WHERE email = 'admin@krishisethu.com';

-- 2. If user doesn't exist, create it (with proper token fields)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    -- Set all token fields to empty strings (not NULL)
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    email_change
)
VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'admin@krishisethu.com',
    crypt('Admin@123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "System Administrator"}',
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',  -- confirmation_token
    '',  -- recovery_token  
    '',  -- email_change_token_new
    '',  -- email_change_token_current
    ''   -- email_change
)
ON CONFLICT (email) DO UPDATE SET
    -- Update token fields to empty strings if they were NULL
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change_token_current = '',
    email_change = '',
    email_confirmed_at = now();

-- 3. Ensure profile exists
INSERT INTO profiles (
    id,
    email,
    name,
    role,
    is_active,
    is_paid,
    trial_start,
    trial_end
)
SELECT 
    id,
    email,
    'System Administrator',
    'admin',
    true,
    true,  -- Admin doesn't need trial
    now(),
    now() + interval '365 days'  -- Give admin a year
FROM auth.users 
WHERE email = 'admin@krishisethu.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    is_paid = true;

-- 4. Verify everything is set up correctly
SELECT 
    u.email,
    u.email_confirmed_at,
    p.name,
    p.role,
    p.is_active,
    p.is_paid,
    CASE 
        WHEN u.confirmation_token IS NULL THEN 'NULL (PROBLEM!)'
        WHEN u.confirmation_token = '' THEN 'EMPTY (GOOD)'
        ELSE 'HAS_VALUE'
    END as token_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@krishisethu.com';