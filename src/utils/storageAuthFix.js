import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Storage Authentication Fix
 * Handles authentication issues for Supabase Storage uploads
 */

// Check if user is authenticated for storage operations
export const checkStorageAuth = async () => {
  try {
    console.log('🔐 Checking storage authentication...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ User authentication error:', userError);
      throw new Error('User not authenticated');
    }
    
    if (!user) {
      console.log('❌ No user found');
      throw new Error('No user authenticated');
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Test storage access with a small operation
    try {
      const { data: storageData, error: storageError } = await supabase.storage
        .from('product-images')
        .list('test/', { limit: 1 });
      
      if (storageError) {
        console.warn('⚠️ Storage access test failed:', storageError);
        // This might be expected if the bucket doesn't exist or is empty
      } else {
        console.log('✅ Storage access test successful');
      }
    } catch (testError) {
      console.warn('⚠️ Storage test error (may be normal):', testError.message);
    }
    
    return { success: true, user };
    
  } catch (error) {
    console.error('❌ Storage authentication check failed:', error);
    return { success: false, error: error.message };
  }
};

// Refresh authentication token if needed
export const refreshAuthIfNeeded = async () => {
  try {
    console.log('🔄 Refreshing authentication...');
    
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('❌ Error refreshing session:', error);
      return { success: false, error: error.message };
    }
    
    if (session) {
      console.log('✅ Session refreshed successfully');
      return { success: true, session };
    } else {
      console.log('❌ No session after refresh');
      return { success: false, error: 'No session available' };
    }
    
  } catch (error) {
    console.error('❌ Exception during auth refresh:', error);
    return { success: false, error: error.message };
  }
};

// Enhanced file upload with authentication handling
export const uploadFileWithAuth = async (file, path = 'uploads/', onProgress = null) => {
  try {
    console.log('📁 Starting authenticated file upload...');
    
    // First check authentication
    const authCheck = await checkStorageAuth();
    if (!authCheck.success) {
      console.error('❌ Authentication check failed:', authCheck.error);
      
      // Try to refresh session
      const refreshResult = await refreshAuthIfNeeded();
      if (!refreshResult.success) {
        throw new Error(`Authentication failed: ${authCheck.error}. Session refresh also failed: ${refreshResult.error}`);
      }
      
      // Check authentication again after refresh
      const finalAuthCheck = await checkStorageAuth();
      if (!finalAuthCheck.success) {
        throw new Error(`Authentication still failed after refresh: ${finalAuthCheck.error}`);
      }
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fullPath = `${path}${fileName}`;
    
    console.log('📁 Uploading file to Supabase:', fileName, 'to path:', fullPath);
    
    // Determine bucket based on path and file type
    let bucket = 'product-images';
    
    if (path.includes('pos/')) {
      bucket = file.type.startsWith('image/') ? 'pos-images' : 'pos-documents';
    } else if (path.includes('products/')) {
      bucket = file.type.startsWith('image/') ? 'product-images' : 'product-documents';
    } else if (file.type.startsWith('image/')) {
      bucket = 'product-images';
    } else {
      bucket = 'product-documents';
    }
    
    console.log('🪣 Using bucket:', bucket);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Supabase upload error:', error);
      
      // Handle specific error types
      if (error.message?.includes('row-level security') || error.message?.includes('permission')) {
        throw new Error('Permission denied. Please ensure you are logged in and have the necessary permissions.');
      } else if (error.message?.includes('payload too large')) {
        throw new Error('File too large. Please choose a smaller file.');
      } else if (error.message?.includes('bucket')) {
        throw new Error('Storage bucket not found. Please contact support.');
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }
    
    console.log('✅ Upload successful:', data);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fullPath);
    
    console.log('📎 Public URL obtained:', publicUrl);
    
    // Simulate progress if callback provided
    if (onProgress) {
      onProgress(100);
    }
    
    return {
      url: publicUrl,
      path: fullPath,
      bucket: bucket,
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        bucket: bucket
      }
    };
    
  } catch (error) {
    console.error('💥 Error in authenticated upload:', error);
    throw error;
  }
};

// Test storage access and provide detailed feedback
export const testStorageAccess = async () => {
  console.log('🧪 Testing storage access...');
  
  const results = {
    timestamp: new Date().toISOString(),
    auth: null,
    storage: null,
    buckets: {},
    overall: 'unknown'
  };
  
  try {
    // Test authentication
    results.auth = await checkStorageAuth();
    
    if (!results.auth.success) {
      results.overall = 'failed';
      return results;
    }
    
    // Test different buckets
    const buckets = ['product-images', 'product-documents', 'pos-images', 'pos-documents'];
    
    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .list('test/', { limit: 1 });
        
        results.buckets[bucket] = {
          accessible: !error,
          error: error?.message || null,
          data: data || null
        };
        
        if (error) {
          console.warn(`⚠️ Bucket ${bucket} not accessible:`, error.message);
        } else {
          console.log(`✅ Bucket ${bucket} accessible`);
        }
        
      } catch (bucketError) {
        results.buckets[bucket] = {
          accessible: false,
          error: bucketError.message,
          data: null
        };
        console.warn(`⚠️ Bucket ${bucket} test failed:`, bucketError.message);
      }
    }
    
    // Determine overall status
    const accessibleBuckets = Object.values(results.buckets).filter(b => b.accessible).length;
    results.overall = accessibleBuckets > 0 ? 'partial' : 'failed';
    
    console.log('📊 Storage test results:', results);
    return results;
    
  } catch (error) {
    results.overall = 'failed';
    results.error = error.message;
    console.error('💥 Storage test failed:', error);
    return results;
  }
};

// Create a wrapper for storage service that handles authentication
export const createAuthenticatedStorageService = () => {
  const originalUploadFile = async (file, path = 'uploads/', onProgress = null) => {
    return uploadFileWithAuth(file, path, onProgress);
  };
  
  return {
    uploadFile: originalUploadFile,
    testStorageAccess,
    checkStorageAuth
  };
};