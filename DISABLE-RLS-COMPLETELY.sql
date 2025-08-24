-- =====================================================
-- DISABLE RLS COMPLETELY FOR USER TABLES
-- Quick fix to eliminate all RLS recursion issues
-- WARNING: This disables security - only for development!
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Users can only see own record" ON public.users;
DROP POLICY IF EXISTS "Multi-tenant users access" ON public.users;
DROP POLICY IF EXISTS "Anonymous users development access" ON public.users;
DROP POLICY IF EXISTS "Allow all for development" ON public.users;
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Multi-tenant profiles access" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous profiles development access" ON public.profiles;
DROP POLICY IF EXISTS "Allow all profiles for development" ON public.profiles;

-- Step 2: Completely disable RLS for user-related tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant full permissions
GRANT ALL PRIVILEGES ON public.users TO anon, authenticated;
GRANT ALL PRIVILEGES ON public.profiles TO anon, authenticated;

-- Step 4: Create profiles for existing users
INSERT INTO public.profiles (
  id, 
  email, 
  name, 
  full_name, 
  role, 
  account_type, 
  is_paid, 
  is_active, 
  trial_start, 
  trial_end,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.email,
  COALESCE(u.full_name, u.email),
  COALESCE(u.full_name, u.email),
  COALESCE(u.role, 'user'),
  'trial',
  false,
  true,
  TIMEZONE('utc', NOW()),
  TIMEZONE('utc', NOW()) + INTERVAL '30 days',
  COALESCE(u.created_at, TIMEZONE('utc', NOW())),
  TIMEZONE('utc', NOW())
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

COMMIT;

-- Verification
SELECT 
  'RLS disabled and profiles synced' as result,
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles;
