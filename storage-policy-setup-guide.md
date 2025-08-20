# 📁 Storage Policies Setup Guide

Since you don't have owner permissions on the storage.objects table, you'll need to set up the storage policies manually through the Supabase Dashboard.

## 🎯 Step-by-Step Instructions

### 1. **Run the Permission-Safe SQL Script First**
```sql
-- Run permission-safe-fix.sql in your Supabase SQL Editor
-- This will fix the registration trigger and create storage buckets
```

### 2. **Access Storage Policies in Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Navigate to **Storage** → **Policies**
3. You should see your buckets: `product-images`, `product-documents`, `pos-images`, `pos-documents`

### 3. **Create Policies for Each Bucket**

For **EACH** of the 4 buckets, create these 4 policies:

#### 📤 **Policy 1: Allow Authenticated Uploads**
- **Policy Name:** `Allow authenticated uploads`
- **Operation:** `INSERT`
- **Target Roles:** `authenticated`
- **Policy Definition:**
```sql
auth.role() = 'authenticated'
```

#### 👁️ **Policy 2: Allow Public Reads**
- **Policy Name:** `Allow public reads`
- **Operation:** `SELECT`
- **Target Roles:** `public`, `authenticated`
- **Policy Definition:**
```sql
true
```

#### ✏️ **Policy 3: Allow Authenticated Updates**
- **Policy Name:** `Allow authenticated updates`
- **Operation:** `UPDATE`
- **Target Roles:** `authenticated`
- **Policy Definition:**
```sql
auth.role() = 'authenticated'
```

#### 🗑️ **Policy 4: Allow Authenticated Deletes**
- **Policy Name:** `Allow authenticated deletes`
- **Operation:** `DELETE`
- **Target Roles:** `authenticated`
- **Policy Definition:**
```sql
auth.role() = 'authenticated'
```

## 🔁 **Quick Setup Process**

### For `product-images` bucket:
1. Click on `product-images` bucket
2. Go to **Policies** tab
3. Click **New Policy**
4. Create all 4 policies above
5. **Save** each policy

### Repeat for other buckets:
- `product-documents`
- `pos-images` 
- `pos-documents`

## ✅ **Verification**

After setting up all policies, you should have:
- ✅ 4 buckets created
- ✅ 16 total policies (4 policies × 4 buckets)
- ✅ Registration working without 500 errors
- ✅ Image uploads working without permission errors

## 🚨 **Alternative: Simple Open Policies (For Testing)**

If you want to quickly test and the above seems complex, you can create just one policy per bucket:

**Policy Name:** `Allow all operations for authenticated users`
**Operations:** `ALL`
**Target Roles:** `authenticated`
**Policy Definition:**
```sql
auth.role() = 'authenticated'
```

This single policy per bucket will allow all authenticated users to upload, read, update, and delete files.

## 🔧 **Troubleshooting**

### If policies don't work:
1. **Check Authentication:** Make sure you're logged in
2. **Check Bucket Names:** Ensure bucket names match exactly
3. **Check Policy Syntax:** Copy policy definitions exactly as shown
4. **Refresh Browser:** Clear cache and refresh
5. **Check Console:** Look for specific error messages

### Common Issues:
- **"Bucket not found"** → Check bucket names in storage
- **"Permission denied"** → Check policy definitions
- **"Authentication failed"** → User needs to log out and log back in

## 📞 **Need Help?**

If you encounter issues:
1. Check the browser console for specific error messages
2. Verify the bucket exists in Storage dashboard
3. Ensure policies are created with correct syntax
4. Test with a simple file upload first

---

✨ **Once completed, both registration and image uploads should work perfectly!**
