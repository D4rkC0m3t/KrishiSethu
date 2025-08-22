-- Simple Authentication Setup - Fixed Version
-- Handles existing triggers and functions properly

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create simple users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(255),
    account_type VARCHAR(50) DEFAULT 'user' CHECK (account_type IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "users_own_profile" ON users;
DROP POLICY IF EXISTS "service_role_access" ON users;
DROP POLICY IF EXISTS "admin_access" ON users;
DROP POLICY IF EXISTS "anonymous_read_access" ON users;

-- RLS Policies
-- Users can view and update their own profile
CREATE POLICY "users_own_profile" ON users
    FOR ALL
    USING (auth.uid() = id);

-- Service role can access all data (for admin functions)
CREATE POLICY "service_role_access" ON users
    FOR ALL
    TO service_role
    USING (true);

-- Admin users can see all users
CREATE POLICY "admin_access" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u2 
            WHERE u2.id = auth.uid() 
            AND u2.account_type = 'admin'
            AND u2.is_active = true
        )
    );

-- Anonymous can read for testing (remove in production)
CREATE POLICY "anonymous_read_access" ON users
    FOR SELECT
    TO anon
    USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name, phone, company, account_type)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'company',
        'user'
    );
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log error but don't fail the auth user creation
        RAISE WARNING 'Failed to create user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Insert some test users (temporarily disable foreign key constraint for testing)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Clear any existing test data
DELETE FROM users WHERE email LIKE '%@test.local';

-- Insert fresh test data
INSERT INTO users (id, email, full_name, phone, company, account_type, is_active) VALUES
('a1111111-1111-1111-1111-111111111111', 'admin@test.local', 'Admin User', '+91-9876543210', 'KrishiSethu', 'admin', true),
('b2222222-2222-2222-2222-222222222222', 'user1@test.local', 'Regular User 1', '+91-9876543211', 'Test Company 1', 'user', true),
('c3333333-3333-3333-3333-333333333333', 'user2@test.local', 'Regular User 2', '+91-9876543212', 'Test Company 2', 'user', true),
('d4444444-4444-4444-4444-444444444444', 'inactive@test.local', 'Inactive User', '+91-9876543213', 'Old Company', 'user', false);

-- Verify the setup
SELECT 
    id,
    email,
    full_name,
    company,
    account_type,
    is_active,
    created_at
FROM users 
ORDER BY created_at DESC;

-- Display success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Simple authentication system setup complete!';
    RAISE NOTICE '📊 Created % test users', (SELECT COUNT(*) FROM users);
    RAISE NOTICE '🔐 RLS policies configured';
    RAISE NOTICE '⚡ Triggers configured for auto user creation';
    RAISE NOTICE '🧪 Test users: admin@test.local, user1@test.local, user2@test.local, inactive@test.local';
END $$;
