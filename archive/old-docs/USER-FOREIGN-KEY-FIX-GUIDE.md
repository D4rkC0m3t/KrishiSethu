# 🔧 User Foreign Key Constraint Fix Guide

## 🚨 **Problem**
```
Error creating user: insert or update on table "users" violates foreign key constraint "users_id_fkey"
```

## 🔍 **Root Cause**
The `public.users` table has a foreign key constraint where `id` must reference an existing `auth.users(id)`. The application was trying to create users directly in `public.users` with random UUIDs that don't exist in Supabase's `auth.users` table.

```sql
-- This is the problematic constraint:
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,  -- ❌ Must exist in auth.users first
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'staff',
    ...
);
```

## ✅ **Solution 1: Database Trigger (Recommended)**

### Step 1: Run the Fix Script
Execute the `fix-user-foreign-key-constraint.sql` script in your Supabase SQL Editor:

```sql
-- This creates a trigger that automatically creates public.users records
-- when auth.users are created through Supabase Auth
```

### Step 2: Update Application Code
Use the new `createUserWithAuth()` method instead of direct database inserts:

```javascript
// ❌ OLD WAY (causes foreign key error):
await usersService.create({
  id: randomUUID(),
  email: 'user@example.com',
  name: 'User Name',
  role: 'staff'
});

// ✅ NEW WAY (proper auth-based creation):
await usersService.createUserWithAuth({
  email: 'user@example.com',
  password: 'TempPassword123!',
  name: 'User Name',
  role: 'staff',
  phone: '+1234567890'
});
```

## ✅ **Solution 2: Fix Existing Users**

If you have existing `auth.users` without corresponding `public.users` records:

```sql
-- Run this in Supabase SQL Editor to create missing public.users records
INSERT INTO public.users (id, email, name, role, is_active)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', email) as name,
    COALESCE(raw_user_meta_data->>'role', 'staff') as role,
    true as is_active
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.users);
```

## 🔄 **How It Works Now**

1. **User Creation Flow**:
   ```
   Supabase Auth API → auth.users table → Trigger → public.users table
   ```

2. **Automatic Sync**:
   - When a user signs up via `supabase.auth.signUp()`
   - Supabase creates record in `auth.users`
   - Our trigger automatically creates matching record in `public.users`
   - Metadata (name, role, phone) is extracted from auth signup data

3. **Data Flow**:
   ```javascript
   const { data, error } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'password123',
     options: {
       data: {
         name: 'User Name',      // → public.users.name
         role: 'staff',          // → public.users.role
         phone: '+1234567890'    // → public.users.phone
       }
     }
   });
   ```

## 🧪 **Testing the Fix**

### Test 1: Create New User
```javascript
try {
  const newUser = await usersService.createUserWithAuth({
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'staff'
  });
  console.log('✅ User created successfully:', newUser);
} catch (error) {
  console.error('❌ User creation failed:', error);
}
```

### Test 2: Verify Database Records
```sql
-- Check that both records exist and are linked
SELECT 
  au.id,
  au.email as auth_email,
  pu.email as public_email,
  pu.name,
  pu.role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'test@example.com';
```

## 🚨 **Important Notes**

1. **Existing Code**: The old `usersService.create()` method will still work for localStorage fallback but will warn about the foreign key issue.

2. **Password Management**: Users created with temporary passwords should be prompted to change them on first login.

3. **Role Security**: Ensure proper RLS policies are in place to prevent unauthorized role changes.

4. **Migration**: Existing applications should gradually migrate to use `createUserWithAuth()` for new user creation.

## 🔧 **Troubleshooting**

### Issue: Trigger not working
```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Recreate trigger if missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Issue: Permission denied
```sql
-- Ensure function has proper security
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
$$ language 'plpgsql' SECURITY DEFINER;  -- ← This is important
```

## ✅ **Verification Checklist**

- [ ] `fix-user-foreign-key-constraint.sql` script executed
- [ ] Trigger `on_auth_user_created` exists in database
- [ ] Function `handle_new_user()` exists with SECURITY DEFINER
- [ ] Application code updated to use `createUserWithAuth()`
- [ ] Test user creation works without foreign key errors
- [ ] Existing users have corresponding public.users records

---

**🎉 After implementing this fix, user creation will work properly without foreign key constraint violations!**
