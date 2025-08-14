# 🚀 Supabase Database Setup Guide

This guide will help you set up your Supabase database for the Krishisethu Inventory Management system.

## 📋 **Prerequisites**

✅ Supabase project created: `https://zwwmfgexghsniecdpypz.supabase.co`  
✅ API key available  
✅ Database access ready  

## 🛠️ **Step 1: Create Database Schema**

### **Option A: Using Supabase Dashboard (Recommended)**

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `zwwmfgexghsniecdpypz`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Schema Script**
   - Copy the entire content from `supabase-schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

4. **Run Seed Data Script**
   - Create another new query
   - Copy the entire content from `supabase-seed-data.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

### **Option B: Using psql Command Line**

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.zwwmfgexghsniecdpypz.supabase.co:5432/postgres"

# Run the schema file
\i supabase-schema.sql

# Run the seed data file
\i supabase-seed-data.sql
```

## 🔐 **Step 2: Configure Authentication**

### **Enable Email Authentication**

1. Go to **Authentication** → **Settings** in Supabase Dashboard
2. Enable **Email** provider
3. Configure email templates (optional)
4. Set up email confirmation (recommended for production)

### **Create Admin User**

1. Go to **Authentication** → **Users**
2. Click **"Add User"**
3. Enter admin details:
   - **Email**: `admin@example.com`
   - **Password**: `Admin@123` (change this!)
   - **Email Confirm**: ✅ (check this)

4. After user is created, update their role:
   ```sql
   UPDATE users
   SET role = 'admin', name = 'System Administrator'
   WHERE email = 'admin@example.com';
   ```

## 📁 **Step 3: Set Up Storage**

### **Create Storage Buckets**

1. Go to **Storage** in Supabase Dashboard
2. Click **"New Bucket"**
3. Create these buckets:

   **Bucket 1: `product-images`**
   - **Name**: `product-images`
   - **Public**: ✅ (checked)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `image/*`

   **Bucket 2: `documents`**
   - **Name**: `documents`
   - **Public**: ❌ (unchecked)
   - **File size limit**: 20 MB
   - **Allowed MIME types**: `application/pdf, image/*`

### **Configure Storage Policies**

For `product-images` bucket:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
);

-- Allow everyone to view product images
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Users can update product images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "Users can delete product images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
);
```

## 🔄 **Step 4: Enable Realtime**

1. Go to **Database** → **Replication** in Supabase Dashboard
2. Enable realtime for these tables:
   - ✅ `products`
   - ✅ `sales`
   - ✅ `stock_movements`
   - ✅ `customers`
   - ✅ `suppliers`

## 🧪 **Step 5: Test the Setup**

### **Test Database Connection**

Run this query in SQL Editor to verify setup:
```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check sample data
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as category_count FROM categories;
SELECT COUNT(*) as brand_count FROM brands;
```

### **Test Authentication**

1. Try logging in with the admin user you created
2. Verify the user appears in the `users` table
3. Check that RLS policies are working

### **Test Storage**

1. Try uploading a test image to `product-images` bucket
2. Verify you can access the public URL
3. Check that policies are enforced

## 📊 **Step 6: Verify Data Structure**

Your database should now have:

### **Tables Created** ✅
- `users` (13 tables total)
- `categories` (10 sample categories)
- `brands` (10 sample brands)
- `suppliers` (4 sample suppliers)
- `customers` (3 sample customers)
- `products` (5 sample products)
- `sales`, `purchases`, `stock_movements` (empty, ready for data)
- `settings` (5 configuration entries)

### **Sample Data** ✅
- **Categories**: NPK, Nitrogen, Phosphorus, Organic, etc.
- **Brands**: Tata Chemicals, IFFCO, Coromandel, etc.
- **Products**: NPK 20-20-20, Urea, DAP, Organic Compost, Zinc Sulphate
- **Settings**: Company info, tax settings, inventory settings

## 🎯 **Next Steps**

After completing this setup:

1. ✅ **Database is ready** for the application
2. ✅ **No more CORS issues** with storage
3. ✅ **Authentication is configured**
4. ✅ **Sample data is loaded**

You can now:
- **Update your React app** to use Supabase instead of Firebase
- **Test file uploads** (no CORS errors!)
- **Start using the inventory system** immediately

## 🆘 **Troubleshooting**

### **Common Issues:**

**Error: "relation does not exist"**
- Make sure you ran the schema script first
- Check that all tables were created successfully

**Error: "permission denied"**
- Verify RLS policies are set up correctly
- Check user authentication status

**Storage upload fails**
- Verify storage policies are created
- Check bucket permissions
- Ensure file size is within limits

**Authentication not working**
- Check if email confirmation is required
- Verify user exists in auth.users table
- Check if user record exists in public.users table

## 📞 **Need Help?**

If you encounter any issues:
1. Check the Supabase Dashboard logs
2. Verify all SQL scripts ran successfully
3. Test each component individually
4. Check the browser console for errors

---

**🎉 Once this setup is complete, your CORS issues will be completely resolved and you'll have a much more powerful database system!**
