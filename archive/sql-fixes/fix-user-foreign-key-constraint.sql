-- ============================================================================
-- 🔧 FIX USER FOREIGN KEY CONSTRAINT ISSUE
-- ============================================================================
-- This script fixes the foreign key constraint error when creating users
-- by adding a trigger that automatically creates public.users records
-- when auth.users are created through Supabase Auth.

-- ============================================================================
-- 👤 USER CREATION TRIGGER (Auto-create public.users from auth.users)
-- ============================================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
        true
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 🔄 ALTERNATIVE: PROPER USER CREATION FUNCTION
-- ============================================================================
-- This function creates users properly through Supabase Auth first,
-- then the trigger will automatically create the public.users record

CREATE OR REPLACE FUNCTION create_user_properly(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT,
    user_role TEXT DEFAULT 'staff',
    user_phone TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- This would typically be done through Supabase Auth API, not SQL
    -- But for reference, this is the proper flow:
    
    -- 1. Create auth.users record (done via Supabase Auth API)
    -- 2. Trigger automatically creates public.users record
    -- 3. Return the user ID
    
    -- For now, return a placeholder
    RAISE EXCEPTION 'Use Supabase Auth API to create users, not this function directly';
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- ============================================================================
-- 📝 USAGE INSTRUCTIONS
-- ============================================================================

/*
To fix the foreign key constraint issue:

1. Run this SQL script in your Supabase SQL Editor

2. Update your application code to use Supabase Auth for user creation:

   // Instead of directly inserting into public.users:
   const { data, error } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'password123',
     options: {
       data: {
         name: 'User Name',
         role: 'staff',
         phone: '+1234567890'
       }
     }
   });

3. The trigger will automatically create the public.users record

4. For existing users without public.users records, run:
   INSERT INTO public.users (id, email, name, role, is_active)
   SELECT id, email, 
          COALESCE(raw_user_meta_data->>'name', email) as name,
          COALESCE(raw_user_meta_data->>'role', 'staff') as role,
          true as is_active
   FROM auth.users 
   WHERE id NOT IN (SELECT id FROM public.users);
*/
