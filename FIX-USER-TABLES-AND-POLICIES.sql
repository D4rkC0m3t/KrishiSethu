-- =====================================================
-- FIX USER TABLES AND RLS POLICIES
-- Resolve infinite recursion and permission errors
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Fix the users table RLS policies (remove infinite recursion)
DROP POLICY IF EXISTS "Users can only see own record" ON public.users;
DROP POLICY IF EXISTS "Multi-tenant users access" ON public.users;
DROP POLICY IF EXISTS "Anonymous users development access" ON public.users;

-- Create safe RLS policies for users table
CREATE POLICY "Users can see own record" ON public.users
  FOR SELECT TO authenticated 
  USING (id = auth.uid());

CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE TO authenticated 
  USING (id = auth.uid());

-- Allow anonymous users to read users for development (be careful with this in production)
CREATE POLICY "Anonymous users development access" ON public.users
  FOR ALL TO anon USING (true);

-- Step 2: Fix profiles table RLS policies
DROP POLICY IF EXISTS "Users can only see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Multi-tenant profiles access" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous profiles development access" ON public.profiles;

-- Create safe RLS policies for profiles table
CREATE POLICY "Users can see own profile" ON public.profiles
  FOR SELECT TO authenticated 
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated 
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated 
  WITH CHECK (id = auth.uid());

-- Allow anonymous users to access profiles for development
CREATE POLICY "Anonymous profiles development access" ON public.profiles
  FOR ALL TO anon USING (true);

-- Step 3: Ensure profiles table has proper structure
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address JSONB,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Step 4: Create a function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  
  -- Also create a user record in the users table if it doesn't exist
  INSERT INTO public.users (
    id, 
    email, 
    full_name,
    organization_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NULL, -- Will be set during organization setup
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Create updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

COMMIT;

-- Verification
SELECT 
  'User tables and policies fixed' as result,
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles;
