# 📁 Storage Setup Guide for KrishiSethu

This guide will help you set up file upload functionality for Product attachments and POS images/documents.

## 🎯 Overview

We're setting up 4 storage buckets in Supabase:

1. **`product-images`** - Product photos (10MB limit)
2. **`product-documents`** - Product attachments like PDFs, docs (20MB limit)  
3. **`pos-images`** - POS related images (5MB limit)
4. **`pos-documents`** - POS related documents (10MB limit)

## 🚀 Quick Setup

### Step 1: Run SQL Script

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `create-storage-buckets.sql`
3. Click **Run** to create all buckets and policies

### Step 2: Verify Setup

1. Go to **Storage** in Supabase Dashboard
2. You should see 4 new buckets created
3. Check that all buckets are marked as **Public**

### Step 3: Test Upload Functionality

1. In your app, navigate to: `localhost:3000/dashboard` 
2. Open browser console and type: `window.location.hash = '#storage-test'`
3. This will open the Storage Test page
4. Test uploading different file types to each bucket

## 📋 Bucket Details

### Product Images (`product-images`)
- **Purpose**: Product photos for inventory
- **File Types**: JPG, PNG, GIF, WebP, SVG
- **Size Limit**: 10MB
- **Path Structure**: `products/{productId}/images/`

### Product Documents (`product-documents`)  
- **Purpose**: Product manuals, certificates, specs
- **File Types**: PDF, DOC, DOCX, TXT, XLS, XLSX
- **Size Limit**: 20MB
- **Path Structure**: `products/{productId}/documents/`

### POS Images (`pos-images`)
- **Purpose**: Receipt photos, customer documents
- **File Types**: JPG, PNG, GIF, WebP
- **Size Limit**: 5MB
- **Path Structure**: `pos/{saleId}/images/`

### POS Documents (`pos-documents`)
- **Purpose**: Sale receipts, customer agreements
- **File Types**: PDF, TXT, DOC, DOCX
- **Size Limit**: 10MB
- **Path Structure**: `pos/{saleId}/documents/`

## 🔧 Usage in Code

### Upload Product Image
```javascript
import { storageService } from '../lib/storage';

const uploadProductImage = async (imageFile, productId) => {
  try {
    const result = await storageService.uploadProductImage(
      imageFile, 
      productId, 
      (progress) => console.log('Progress:', progress)
    );
    console.log('Upload successful:', result.url);
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
};
```

### Upload Product Document
```javascript
const uploadProductDocument = async (documentFile, productId) => {
  try {
    const result = await storageService.uploadProductDocument(
      documentFile, 
      productId
    );
    console.log('Document uploaded:', result.url);
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
};
```

### Upload POS Image
```javascript
const uploadPOSImage = async (imageFile, saleId) => {
  try {
    const result = await storageService.uploadPOSImage(
      imageFile, 
      saleId
    );
    console.log('POS image uploaded:', result.url);
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
};
```

### Upload POS Document
```javascript
const uploadPOSDocument = async (documentFile, saleId) => {
  try {
    const result = await storageService.uploadPOSDocument(
      documentFile, 
      saleId
    );
    console.log('POS document uploaded:', result.url);
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
};
```

## 🧪 Testing

### Manual Testing
1. Go to Storage Test page: `localhost:3000/dashboard#storage-test`
2. Try uploading different file types
3. Verify files appear in Supabase Storage
4. Check that public URLs work

### Automated Testing
```bash
# Run storage tests
npm run test:storage

# Test specific bucket
npm run test:storage -- --grep "product-images"
```

## 🔒 Security Notes

- All buckets are set to **public** for easy access
- File size limits are enforced at upload time
- MIME type validation prevents malicious uploads
- Consider adding virus scanning for production

## 🚨 Troubleshooting

### "Bucket already exists" Error
- This is normal if you run the setup script multiple times
- The script will skip existing buckets

### Upload Fails with 413 Error
- File exceeds size limit
- Check file size before upload

### Upload Fails with 415 Error  
- File type not allowed
- Check MIME type restrictions

### Cannot Access Uploaded Files
- Verify bucket is set to public
- Check RLS policies are correct
- Ensure file path is correct

## 📊 Monitoring

### Check Storage Usage
```sql
-- View storage statistics
SELECT * FROM storage_stats;

-- Check specific bucket
SELECT * FROM storage.objects WHERE bucket_id = 'product-images';
```

### Clean Up Old Files
```sql
-- Remove files older than 30 days
SELECT cleanup_old_files('product-images', 30);
```

## 🎯 Next Steps

1. ✅ **Setup Complete** - Buckets created and tested
2. 🔧 **Integration** - Upload functionality working in Add Product and POS
3. 📱 **Mobile Testing** - Test uploads on mobile devices
4. 🚀 **Production** - Deploy with proper monitoring
5. 🔒 **Security** - Add virus scanning and advanced validation

## 📞 Support

If you encounter issues:
1. Check Supabase Dashboard for error logs
2. Verify bucket permissions in Storage settings
3. Test with small files first
4. Check browser console for detailed error messages

---

**✨ Your file upload system is now ready for production use!** 🌾
