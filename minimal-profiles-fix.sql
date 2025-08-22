-- ==============================
-- Minimal Fix for Profiles Table Issue
-- This adds just what's needed to fix the supplier creation error
-- ==============================

-- Create profiles table with organization_id column to satisfy existing functions
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gst_number TEXT,
  role TEXT DEFAULT 'customer',
  account_type TEXT DEFAULT 'trial',
  is_active BOOLEAN DEFAULT true,
  is_paid BOOLEAN DEFAULT false,
  trial_start_date TIMESTAMPTZ DEFAULT NOW(),
  trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  organization_id UUID DEFAULT gen_random_uuid(), -- Add this to satisfy existing functions
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can insert their own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id)';
    END IF;
END $$;

-- Create our handle_new_user function only if no similar trigger function exists
CREATE OR REPLACE FUNCTION public.handle_new_user_krishisethu()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, organization_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email,
    'customer',
    gen_random_uuid()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return NEW
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created_krishisethu'
    ) THEN
        CREATE TRIGGER on_auth_user_created_krishisethu
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_krishisethu();
    END IF;
END $$;

-- Create profile for existing users (if any)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT * FROM auth.users WHERE confirmed_at IS NOT NULL
    LOOP
        BEGIN
            INSERT INTO public.profiles (id, email, full_name, organization_id)
            VALUES (
                user_record.id,
                user_record.email,
                COALESCE(
                    user_record.raw_user_meta_data->>'full_name', 
                    user_record.raw_user_meta_data->>'name', 
                    split_part(user_record.email, '@', 1)
                ),
                gen_random_uuid()
            );
        EXCEPTION
            WHEN unique_violation THEN
                NULL; -- Profile already exists, ignore
        END;
    END LOOP;
END
$$;

-- Create suppliers table if it doesn't exist (this is what we really need)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gst_number TEXT,
  pan_number TEXT,
  payment_terms TEXT DEFAULT 'Cash',
  credit_limit NUMERIC(12,2) DEFAULT 0,
  outstanding_amount NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for suppliers table
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy for suppliers (users can manage suppliers)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'suppliers'
        AND policyname = 'Users can manage suppliers'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can manage suppliers" ON suppliers FOR ALL USING (true)';
    END IF;
END $$;
