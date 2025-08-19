-- Corrected user creation script that includes all required token fields
-- This prevents the "Database error querying schema" issue

-- Create admin user with all required fields properly set
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
    -- These token fields MUST be set to empty strings, not NULL
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    email_change
)
VALUES (
    uuid_generate_v4(),
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
    -- Set all token fields to empty strings (not NULL)
    '',  -- confirmation_token
    '',  -- recovery_token  
    '',  -- email_change_token_new
    '',  -- email_change_token_current
    ''   -- email_change
)
ON CONFLICT (email) DO UPDATE SET
    -- Update token fields to empty strings if they were NULL
    confirmation_token = COALESCE(auth.users.confirmation_token, ''),
    recovery_token = COALESCE(auth.users.recovery_token, ''),
    email_change_token_new = COALESCE(auth.users.email_change_token_new, ''),
    email_change_token_current = COALESCE(auth.users.email_change_token_current, ''),
    email_change = COALESCE(auth.users.email_change, '');

-- Verify the user was created correctly
SELECT 
    email,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    email_change,
    CASE 
        WHEN confirmation_token IS NULL THEN 'NULL (PROBLEM!)'
        WHEN confirmation_token = '' THEN 'Empty (GOOD)'
        ELSE 'Has Value'
    END as confirmation_token_status
FROM auth.users 
WHERE email = 'admin@krishisethu.com';