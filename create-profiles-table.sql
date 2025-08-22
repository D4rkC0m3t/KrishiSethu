-- Create profiles table to fix the "relation profiles does not exist" error
-- This table is referenced by RLS policies or triggers in the database

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  name TEXT,
  role TEXT DEFAULT 'user',
  account_type TEXT DEFAULT 'trial',
  is_active BOOLEAN DEFAULT true,
  is_paid BOOLEAN DEFAULT false,
  trial_start_date TIMESTAMPTZ DEFAULT NOW(),
  trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profile for existing authenticated user (if any)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get current authenticated users and create profiles for them
    FOR user_record IN SELECT * FROM auth.users WHERE confirmed_at IS NOT NULL
    LOOP
        INSERT INTO public.profiles (id, email, full_name, name)
        VALUES (
            user_record.id,
            user_record.email,
            user_record.raw_user_meta_data->>'full_name',
            COALESCE(
                user_record.raw_user_meta_data->>'name', 
                user_record.raw_user_meta_data->>'full_name', 
                split_part(user_record.email, '@', 1)
            )
        )
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END
$$;
