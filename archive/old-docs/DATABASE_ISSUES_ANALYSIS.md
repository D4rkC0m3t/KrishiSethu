# Database Issues Analysis and Fixes
**Generated**: 2025-01-18T16:49:48Z

## 🚨 Critical Issues Found

### 1. **Supabase Client Configuration Error**
**Issue**: Schema configuration in `src/lib/supabase.js` is incorrect
```javascript
// ❌ INCORRECT - Causes "schema must be public" error
db: {
  schema: ['public', 'auth']  // Arrays not supported
}
```

**Fix**: Remove schema configuration or use string
```javascript
// ✅ CORRECT - Let Supabase use default 'public' schema
// Remove the db.schema config entirely
```

### 2. **Missing User Profile Table**
**Issue**: Frontend expects `user_profiles` or `profiles` table but it may not exist
- AuthContext tries to query both `user_profiles` and `profiles`
- No proper user profile creation trigger

### 3. **Field Mapping Complexity**
**Issue**: Extensive camelCase ↔ snake_case conversion
- Every database operation requires field mapping
- Potential for mapping errors and missed fields
- Performance overhead

### 4. **Authentication Flow Issues**
- No RLS policies verification
- Missing user role assignment
- Potential permission denied errors

## 🔧 Immediate Fixes Required

### Fix 1: Update Supabase Client Configuration

```javascript
// File: src/lib/supabase.js
const supabase = createClient(supabaseUrl, activeKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  // ❌ REMOVE THIS - CAUSING SCHEMA ERROR
  // db: {
  //   schema: ['public', 'auth']
  // },
  global: {
    headers: {
      'X-Client-Info': 'krishisethu-inventory@1.0.0'
    }
  }
})
```

### Fix 2: Verify Database Tables Exist

Required tables that frontend expects:
1. `users` - User management
2. `user_profiles` or `profiles` - User profile data
3. `categories` - Product categories
4. `brands` - Product brands
5. `suppliers` - Supplier data
6. `customers` - Customer data
7. `products` - Product inventory
8. `sales` - Sales transactions
9. `purchases` - Purchase orders
10. `stock_movements` - Inventory tracking

### Fix 3: Field Mapping Issues

**Current Problems**:
- `maxStockLevel` field mapped but doesn't exist in Prisma schema
- Inconsistent field naming between frontend and database
- Some fields like `balanceAmount` removed from mapping but may still be used

**Frontend Expects** | **Database Has** | **Status**
--------------------|------------------|------------
`purchasePrice` | `purchase_price` | ✅ Mapped
`salePrice` | `sale_price` | ✅ Mapped
`categoryId` | `category_id` | ✅ Mapped
`brandId` | `brand_id` | ✅ Mapped
`maxStockLevel` | ❌ NOT IN SCHEMA | ❌ Issue
`balanceAmount` | ❌ NOT IN SCHEMA | ❌ Issue

## 🔍 Authentication Issues

### Missing RLS Policies
Frontend code suggests these permissions are needed:
- Users can CRUD their own data
- Role-based access (admin, manager, staff)
- Product access based on user role

### User Role System
AuthContext expects:
```javascript
USER_ROLES = {
  ADMIN: 'admin',
  TRIAL: 'trial', 
  PAID: 'paid',
  CUSTOMER: 'trial'
}
```

But Prisma schema has:
```javascript
enum UserRole {
  admin
  manager
  staff  
  viewer
}
```

**Mismatch**: Frontend expects `trial` and `paid` roles, but database has `staff` and `viewer`.

## 🛠️ Database Migration Needed

### 1. Create User Profile Table
```sql
-- If user_profiles doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'trial',
  account_type TEXT DEFAULT 'trial',
  is_active BOOLEAN DEFAULT true,
  is_paid BOOLEAN DEFAULT false,
  trial_start_date TIMESTAMPTZ DEFAULT NOW(),
  trial_end_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Add Missing Columns to Products
```sql
-- Add max_stock_level if missing
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock_level DECIMAL(10,2) DEFAULT 0;
```

### 3. Enable RLS on All Tables
```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables
```

### 4. Create Basic RLS Policies
```sql
-- Allow authenticated users to read categories
CREATE POLICY "Allow authenticated read categories" ON categories
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read/write products  
CREATE POLICY "Allow authenticated access products" ON products
  FOR ALL TO authenticated USING (true);
```

## 📋 Priority Action Items

### Immediate (Fix Now)
1. **Fix Supabase client configuration** - Remove schema array
2. **Test database connectivity** - Verify connection works
3. **Check table existence** - Ensure all required tables exist

### High Priority (Fix Today)
4. **Create missing tables** - Add user_profiles table
5. **Add missing columns** - max_stock_level, etc.
6. **Enable RLS** - Add basic security policies

### Medium Priority (Fix This Week)
7. **Sync user roles** - Align frontend and database roles
8. **Optimize field mapping** - Reduce conversion overhead
9. **Add proper error handling** - Better error messages

### Low Priority (Future Enhancement)
10. **Performance optimization** - Indexes and query optimization
11. **Audit logging** - Track all database changes
12. **Backup strategy** - Regular backups

## 🧪 Testing Strategy

### 1. Basic Connectivity Test
```javascript
const { data, error } = await supabase.from('categories').select('id').limit(1);
```

### 2. Authentication Test
```javascript
const { data: { user } } = await supabase.auth.getUser();
```

### 3. CRUD Operations Test
```javascript
// Test each table with basic CRUD
```

### 4. Field Mapping Test
```javascript
// Test camelCase to snake_case conversion
```

## 📞 Next Steps

1. Apply the Supabase client fix immediately
2. Run database connectivity test
3. Create missing tables/columns
4. Test authentication flow
5. Verify all CRUD operations work
6. Deploy fixes incrementally

---

**Status**: 🔴 Critical Issues Found - Immediate Action Required
**Priority**: High - Database connectivity broken
**Impact**: Application cannot connect to database
**ETA to Fix**: 2-4 hours
