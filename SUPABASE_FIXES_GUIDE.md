# 🔧 Supabase Issues Fix Implementation Guide

## Overview
This guide walks you through fixing the three major Supabase errors:
- **406 (Not Acceptable)** when querying `/users`
- **500 (Internal Server Error)** from infinite recursion in profiles RLS
- **400 (Bad Request)** on `POST /users` with conflict handling

## Step 1: Apply Database Fixes 🗄️

### 1.1 Run the SQL Fix
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `fix-supabase-issues.sql`
4. Copy the entire content and paste it into Supabase SQL Editor
5. Click **"Run"**

**Expected Output:**
```
✅ SUPABASE ISSUES FIXED!
🔧 Fixed Issues:
   ✅ 500 Error: Removed recursive RLS policies
   ✅ 406 Error: Table structure normalized
   ✅ 400 Error: Fixed user creation flow
```

### 1.2 Verify Database State
After running the SQL, you should see:
- Non-recursive RLS policies
- Proper user creation trigger
- Correct table structure

---

## Step 2: Update Client-Side Code 💻

### 2.1 Replace AuthContext.js
1. Backup your current `src/contexts/AuthContext.js`
2. Replace it with the content from `AuthContext-fixed.js`
3. The fixed version includes:
   - ✅ **Proper table querying** (tries users → profiles → user_profiles)
   - ✅ **Non-recursive profile loading**
   - ✅ **Correct Supabase client usage**
   - ✅ **Fixed signup flow using Supabase Auth**

### 2.2 Key Changes Made

#### Before (Problematic):
```js
// ❌ This could cause 406 errors with wrong headers/queries
const { data: profile, error } = await supabase
  .from('users')  // Hardcoded table name
  .select('*')
  .eq('id', user.id)
  .single();

// ❌ This could cause 500 recursion errors
CREATE POLICY "Users can read their profile"
ON profiles
FOR SELECT
USING (
  id IN (SELECT id FROM profiles WHERE role = 'admin')  -- RECURSIVE!
);
```

#### After (Fixed):
```js
// ✅ Tries multiple table names gracefully
const tableNames = ['users', 'profiles', 'user_profiles'];
for (const tableName of tableNames) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', user.id)
    .single();
  // Handle success/failure gracefully
}

// ✅ Non-recursive RLS policies
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);  -- No table lookup, no recursion
```

---

## Step 3: Test the Fixes 🧪

### 3.1 Test User Registration (Fixes 400 Error)
1. Go to your app's registration page
2. Try creating a new user
3. **Should work now** without 400 errors
4. Check the user appears in both `auth.users` and your profile table

#### Expected Behavior:
```js
// ✅ Now uses Supabase Auth properly
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
});
// No more manual insertion into auth.users table
```

### 3.2 Test Profile Loading (Fixes 406 & 500 Errors)
1. Log in with an existing user
2. Navigate around your app
3. **Should load without** 406 Not Acceptable errors
4. **Should load without** 500 infinite recursion errors

#### Expected Behavior:
- ✅ Profile loads from correct table
- ✅ No more "infinite recursion detected" errors  
- ✅ No more 406 errors when querying user data

### 3.3 Test Various Scenarios
1. **New user signup** → Should create profile automatically
2. **Existing user login** → Should load profile from database
3. **Admin user access** → Should work with admin policies
4. **Table switching** → Should handle different table names gracefully

---

## Step 4: Verification Checklist ✅

### Database Level:
- [ ] RLS policies are non-recursive
- [ ] User creation trigger works properly
- [ ] Tables have correct structure
- [ ] Admin access policies work

### Application Level:
- [ ] Registration works without 400 errors
- [ ] Login loads profiles without 406 errors  
- [ ] Navigation doesn't cause 500 recursion errors
- [ ] Multiple table names handled gracefully
- [ ] Error handling is robust

---

## Common Issues & Solutions 🚨

### Issue 1: "Table doesn't exist"
**Solution:** The SQL script creates missing tables automatically. If you see this error, re-run the SQL script.

### Issue 2: "Policy already exists"
**Solution:** The SQL script drops existing policies first, then recreates them. This is expected.

### Issue 3: "Still getting 406 errors"
**Solution:** Make sure you're using the fixed `AuthContext.js` that properly queries multiple table names.

### Issue 4: "Users not being created"
**Solution:** Check that the trigger was created successfully. Run this query:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## Emergency Rollback 🔄

If something goes wrong, you can disable RLS temporarily:

```sql
-- EMERGENCY: Disable RLS for testing
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
```

**Remember to re-enable RLS after fixing issues:**
```sql
-- Re-enable RLS after fixes
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
```

---

## Production Deployment 🚀

### Before Deploying:
1. Test all fixes in development
2. Verify user registration flow works
3. Test existing user login flow
4. Check admin functionality still works

### Deployment Steps:
1. Apply SQL fixes to production database
2. Deploy updated `AuthContext.js` to production
3. Monitor error logs for any remaining issues
4. Test critical user flows immediately after deployment

---

## Summary 📋

### What We Fixed:
1. **500 Error**: Removed recursive RLS policies that caused infinite loops
2. **406 Error**: Fixed client-side querying to use proper Supabase client methods
3. **400 Error**: Changed signup flow to use `supabase.auth.signUp()` instead of manual insertion

### Key Improvements:
- ✅ Robust error handling
- ✅ Multiple table name support  
- ✅ Non-recursive RLS policies
- ✅ Proper Supabase Auth usage
- ✅ Graceful fallbacks for missing data

Your app should now work smoothly without these critical Supabase errors! 🎉
