# 🔐 Row Level Security (RLS) Setup Guide

## 🎯 Overview

This guide helps you enable and configure Row Level Security (RLS) for the KrishiSethu Inventory Management System. RLS provides fine-grained access control at the database level.

---

## 📋 Current Status

**RLS is currently DISABLED** in your database for testing purposes. This guide will help you:

1. **Enable RLS** with proper security policies
2. **Test RLS** functionality 
3. **Manage RLS** for different environments
4. **Troubleshoot** RLS issues

---

## 🚀 Quick Setup

### **Option 1: Enable RLS with Full Security (Recommended for Production)**

```sql
-- Run this in Supabase SQL Editor
\i enable-rls-security.sql
```

### **Option 2: Disable RLS for Testing (Current State)**

```sql
-- Run this in Supabase SQL Editor  
\i disable-rls-for-testing.sql
```

---

## 🔧 Step-by-Step RLS Setup

### **Step 1: Prepare Authentication**

Before enabling RLS, ensure you have:

1. **Admin User Created**:
```sql
-- Create admin user in Supabase Auth Dashboard or via SQL
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@krishisethu.com',
  crypt('your-secure-password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Add to users table
INSERT INTO public.users (id, email, name, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@krishisethu.com'),
  'admin@krishisethu.com',
  'System Administrator',
  'admin',
  true
);
```

2. **Test Authentication**:
```javascript
// Test in browser console
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@krishisethu.com',
  password: 'your-secure-password'
});
console.log('Auth result:', { data, error });
```

### **Step 2: Enable RLS**

1. **Run the RLS Setup Script**:
```bash
# In Supabase SQL Editor, copy and paste the entire content of:
# enable-rls-security.sql
```

2. **Verify RLS is Enabled**:
```sql
-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

3. **Check Policies**:
```sql
-- View all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### **Step 3: Test RLS Functionality**

1. **Test as Authenticated User**:
```sql
-- These should work for authenticated users
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM brands;
```

2. **Test Role-Based Access**:
```sql
-- Should only show your own user record (or all if admin)
SELECT * FROM users;

-- Should only work for admins
SELECT COUNT(*) FROM audit_logs;
```

3. **Test CRUD Operations**:
```sql
-- Test insert (should work based on role)
INSERT INTO categories (name, description) 
VALUES ('Test Category', 'Test description');

-- Test update (should work based on role)
UPDATE categories 
SET description = 'Updated description' 
WHERE name = 'Test Category';

-- Test delete (should work based on role)
DELETE FROM categories WHERE name = 'Test Category';
```

---

## 👥 User Roles & Permissions

### **Role Hierarchy**

1. **Admin** (`admin`)
   - Full access to all tables
   - Can manage users
   - Can view audit logs
   - Can manage system settings

2. **Manager** (`manager`)
   - Can manage inventory, suppliers, customers
   - Can view reports and sales
   - Cannot manage users or system settings
   - Cannot view audit logs

3. **Staff** (`staff`)
   - Can process sales and update inventory
   - Can view products, categories, brands
   - Cannot manage suppliers or customers
   - Cannot view sensitive data

### **Permission Matrix**

| Table | Admin | Manager | Staff |
|-------|-------|---------|-------|
| users | CRUD | R | R (own) |
| categories | CRUD | CRUD | R |
| brands | CRUD | CRUD | R |
| suppliers | CRUD | CRUD | R |
| customers | CRUD | CRU | CR |
| products | CRUD | CRUD | RU* |
| sales | CRUD | CRUD | CR |
| purchases | CRUD | CRUD | R |
| settings | CRUD | R | R |
| audit_logs | RD | - | - |

*U = Update quantity only

---

## 🧪 Testing RLS

### **Automated Tests**

```bash
# Run database tests with RLS enabled
npm run test:database:security

# Run full database test suite
npm run test:database
```

### **Manual Testing**

1. **Create Test Users**:
```sql
-- Create test users for each role
INSERT INTO public.users (id, email, name, role, is_active) VALUES
(gen_random_uuid(), 'admin@test.com', 'Test Admin', 'admin', true),
(gen_random_uuid(), 'manager@test.com', 'Test Manager', 'manager', true),
(gen_random_uuid(), 'staff@test.com', 'Test Staff', 'staff', true);
```

2. **Test Each Role**:
```javascript
// Test admin access
await supabase.auth.signInWithPassword({
  email: 'admin@test.com',
  password: 'test-password'
});

// Try accessing different tables
const { data: users } = await supabase.from('users').select('*');
const { data: auditLogs } = await supabase.from('audit_logs').select('*');

console.log('Admin can see users:', users?.length);
console.log('Admin can see audit logs:', auditLogs?.length);
```

### **Expected Behavior**

- **Unauthenticated users**: Cannot access any data
- **Staff users**: Can see products, process sales, limited access
- **Manager users**: Can manage inventory and operations
- **Admin users**: Full access to everything

---

## 🔄 Environment Management

### **Development Environment**
```sql
-- Disable RLS for easier development
\i disable-rls-for-testing.sql
```

### **Staging Environment**
```sql
-- Enable RLS with test data
\i enable-rls-security.sql
-- Create test users with different roles
```

### **Production Environment**
```sql
-- Enable RLS with full security
\i enable-rls-security.sql
-- Create real admin users
-- Remove test data
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. "permission denied" Errors**
```
Error: permission denied for table products
```

**Solutions**:
- Check if user is authenticated
- Verify user role in `users` table
- Check if RLS policies allow the operation
- Ensure user is active (`is_active = true`)

#### **2. "row-level security policy" Errors**
```
Error: new row violates row-level security policy
```

**Solutions**:
- Check INSERT/UPDATE policies
- Verify user has required role
- Check policy conditions

#### **3. No Data Returned**
```
Query returns empty result set
```

**Solutions**:
- Check SELECT policies
- Verify user authentication
- Check if data exists without RLS

### **Debug Queries**

```sql
-- Check current user
SELECT auth.uid(), auth.role();

-- Check user profile
SELECT * FROM users WHERE id = auth.uid();

-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies for a table
SELECT * FROM pg_policies WHERE tablename = 'products';
```

### **Bypass RLS (Admin Only)**
```sql
-- Temporarily bypass RLS for debugging (use carefully!)
SET row_security = off;
SELECT * FROM products;
SET row_security = on;
```

---

## 📊 Monitoring & Auditing

### **Monitor RLS Performance**
```sql
-- Check slow queries related to RLS
SELECT 
    query,
    mean_time,
    calls,
    total_time
FROM pg_stat_statements 
WHERE query LIKE '%policy%' OR query LIKE '%rls%'
ORDER BY mean_time DESC;
```

### **Audit RLS Changes**
```sql
-- Check recent policy changes
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🔒 Security Best Practices

### **1. Principle of Least Privilege**
- Give users minimum required permissions
- Use role-based access control
- Regularly review and update permissions

### **2. Policy Design**
- Keep policies simple and readable
- Test policies thoroughly
- Document policy logic

### **3. Authentication**
- Use strong passwords
- Enable email confirmation
- Implement session management

### **4. Monitoring**
- Monitor failed access attempts
- Log policy violations
- Regular security audits

---

## 📝 Quick Commands

```bash
# Enable RLS
psql -f enable-rls-security.sql

# Disable RLS for testing
psql -f disable-rls-for-testing.sql

# Test RLS
npm run test:database:security

# Check RLS status
psql -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
```

---

## 📞 Support

### **Getting Help**
- Check Supabase documentation on RLS
- Review policy syntax in PostgreSQL docs
- Test with different user roles
- Check authentication status

### **Common Resources**
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Database Test Results](test-results/database-tests/)

---

**Last Updated**: 2024-01-16  
**Version**: 1.0  
**Maintainer**: KrishiSethu Development Team
