import { supabase, supabaseStorageHelpers } from './supabase';

/**
 * Supabase Storage Service for handling file uploads
 * Supports images, documents, and other file types
 * No CORS issues! 🎉
 */
class StorageService {
  constructor() {
    this.storage = supabase.storage;
  }

  /**
   * Upload a single file to Supabase Storage
   * @param {File} file - The file to upload
   * @param {string} path - Storage path (e.g., 'products/images/')
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<{url: string, path: string, metadata: object}>}
   */
  async uploadFile(file, path = 'uploads/', onProgress = null) {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const fullPath = `${path}${fileName}`;

      console.log('📁 Uploading file to Supabase:', fileName, 'to path:', fullPath);

      // Determine bucket based on path
      let bucket = 'product-images'; // default bucket
      if (path.includes('documents')) {
        bucket = 'documents';
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
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
      console.error('Error uploading file:', error);

      // Handle Supabase-specific errors
      if (error.message?.includes('row-level security')) {
        throw new Error('Upload failed: Permission denied. Please check your authentication.');
      } else if (error.message?.includes('payload too large')) {
        throw new Error('Upload failed: File too large. Please choose a smaller file.');
      } else if (error.message?.includes('bucket')) {
        throw new Error('Upload failed: Storage bucket not found. Please contact support.');
      }

      throw new Error(`Failed to upload file: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple files
   * @param {FileList|Array} files - Files to upload
   * @param {string} path - Storage path
   * @param {Function} onProgress - Progress callback for each file
   * @returns {Promise<Array>} Array of upload results
   */
  async uploadMultipleFiles(files, path = 'uploads/', onProgress = null) {
    try {
      const uploadPromises = Array.from(files).map((file, index) => {
        const fileProgress = onProgress ? (progress) => onProgress(index, progress) : null;
        return this.uploadFile(file, path, fileProgress);
      });
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw new Error(`Failed to upload files: ${error.message}`);
    }
  }

  /**
   * Upload product image
   * @param {File} imageFile - Image file to upload
   * @param {string} productId - Product ID for organizing files
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<object>} Upload result
   */
  async uploadProductImage(imageFile, productId, onProgress = null) {
    console.log('📸 Starting image upload:', imageFile.name, `(${this.formatFileSize(imageFile.size)})`);

    // Validate image file
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      throw new Error('Image file size must be less than 5MB');
    }

    const path = `products/${productId}/images/`;

    try {
      const result = await this.uploadFile(imageFile, path, onProgress);
      console.log('✅ Image upload successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Image upload failed:', error);

      // Try fallback upload without progress tracking
      if (onProgress) {
        console.log('🔄 Retrying upload without progress tracking...');
        try {
          const fallbackResult = await this.uploadFile(imageFile, path, null);
          console.log('✅ Fallback upload successful:', fallbackResult);
          return fallbackResult;
        } catch (fallbackError) {
          console.error('❌ Fallback upload also failed:', fallbackError);
          throw fallbackError;
        }
      }

      throw error;
    }
  }

  /**
   * Upload product document
   * @param {File} documentFile - Document file to upload
   * @param {string} productId - Product ID for organizing files
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<object>} Upload result
   */
  async uploadProductDocument(documentFile, productId, onProgress = null) {
    // Validate document file
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(documentFile.type)) {
      throw new Error('Document must be PDF, DOC, DOCX, or TXT format');
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (documentFile.size > maxSize) {
      throw new Error('Document file size must be less than 10MB');
    }
    
    const path = `products/${productId}/documents/`;
    return await this.uploadFile(documentFile, path, onProgress);
  }

  /**
   * Delete a file from storage
   * @param {string} filePath - Full path to the file in storage
   * @param {string} bucket - Storage bucket name
   * @returns {Promise<void>}
   */
  async deleteFile(filePath, bucket = 'product-images') {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw new Error(error.message);
      }

      console.log('File deleted successfully:', filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * List all files in a directory
   * @param {string} path - Directory path
   * @param {string} bucket - Storage bucket name
   * @returns {Promise<Array>} Array of file references
   */
  async listFiles(path, bucket = 'product-images') {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path);

      if (error) {
        throw new Error(error.message);
      }

      const files = data.map(file => {
        const fullPath = `${path}/${file.name}`;
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fullPath);

        return {
          name: file.name,
          path: fullPath,
          url: publicUrl,
          metadata: {
            size: file.metadata?.size,
            lastModified: file.updated_at,
            contentType: file.metadata?.mimetype
          }
        };
      });

      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Get file download URL
   * @param {string} filePath - Full path to the file
   * @param {string} bucket - Storage bucket name
   * @returns {Promise<string>} Download URL
   */
  async getFileURL(filePath, bucket = 'product-images') {
    try {
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw new Error(`Failed to get file URL: ${error.message}`);
    }
  }

  /**
   * Validate file type and size
   * @param {File} file - File to validate
   * @param {object} options - Validation options
   * @returns {boolean} True if valid
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/*', 'application/pdf', 'application/msword'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx']
    } = options;

    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    // Check file type
    const isTypeAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const isExtensionAllowed = allowedExtensions.includes(fileExtension);

    if (!isTypeAllowed && !isExtensionAllowed) {
      throw new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`);
    }

    return true;
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size string
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create and export a singleton instance
export const storageService = new StorageService();
export default storageService;
