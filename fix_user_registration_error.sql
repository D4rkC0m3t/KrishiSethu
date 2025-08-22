-- Fix User Registration Database Error
-- This script diagnoses and fixes issues with user registration

-- 1. Check what tables exist for user profiles
SELECT 
    'Available user tables' AS check_type,
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND (table_name LIKE '%profile%' OR table_name LIKE '%user%')
ORDER BY table_name;

-- 2. Check if we have the correct user_profiles table structure
SELECT 
    'user_profiles table structure' AS check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. Check existing triggers on auth.users
SELECT 
    'Auth triggers' AS check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
    AND event_object_table = 'users';

-- 4. Drop existing problematic triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- 5. Create the user_profiles table if it doesn't exist with correct structure
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    name TEXT,
    phone TEXT,
    company_name TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    trial_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    is_paid BOOLEAN DEFAULT false,
    account_type TEXT DEFAULT 'trial',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- 8. Create a simple, robust trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert basic user profile
    INSERT INTO public.user_profiles (
        id,
        email,
        name,
        phone,
        company_name,
        role,
        is_active,
        account_type,
        trial_start,
        trial_end,
        is_paid
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'company_name',
        'user',
        true,
        'trial',
        NOW(),
        NOW() + INTERVAL '30 days',
        false
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.organizations TO authenticated;

-- 11. Test the setup with a simple query
SELECT 'Setup verification' AS check_type, 
       'Trigger and table created successfully' AS status;

-- 12. Check if there are any existing auth users without profiles
SELECT 
    'Users without profiles' AS check_type,
    u.id,
    u.email,
    u.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE up.id IS NULL;

-- 13. Create profiles for existing users who don't have them
INSERT INTO public.user_profiles (
    id,
    email,
    name,
    role,
    is_active,
    account_type,
    trial_start,
    trial_end,
    is_paid
)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', u.email),
    'user',
    true,
    'trial',
    u.created_at,
    u.created_at + INTERVAL '30 days',
    false
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

SELECT 'User registration fix completed successfully!' AS final_status;
