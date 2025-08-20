import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { productsService, suppliersService, brandsService } from '../lib/supabaseDb';
import { supabase } from '../lib/supabase';
import { storageService } from '../lib/storage';
import { useAuth } from '../contexts/AuthContext';
import {
  getDatabaseCategories,
  getDynamicCategoryTypes,
  transformToDb,
  validateDataConsistency
} from '../config/databaseSync';
import {
  CATEGORIES,
  FERTILIZER_TYPES,
  UNITS,
  GST_RATES,
  getTypesForCategory,
  getHSNCode,
  getSuggestedGSTRate
} from '../config/fertilizerConfig';

const AddProduct = ({ onNavigate, productToEdit = null }) => {
  const { currentUser, userProfile, isManager } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    categoryId: '', // Changed from 'category' to 'categoryId' to match database schema
    brandId: '', // Changed from 'brand' to 'brandId' to match database schema
    batchNo: '',
    expiryDate: '',
    purchasePrice: '',
    salePrice: '',
    quantity: '',
    minStockLevel: '10',
    unit: 'kg',
    supplierId: '',
    hsn: '',
    gstRate: '',
    barcode: '',
    manufacturingDate: '',
    attachments: [],
    imageUrls: [], // Add imageUrls array for product images
    description: ''
  });

  // Add state for user feedback
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'
  const [saveMessage, setSaveMessage] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Helper function to safely convert date to input format
  const formatDateForInput = (date) => {
    if (!date) return '';

    try {
      // Handle different date formats
      let dateObj;

      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string' || typeof date === 'number') {
        dateObj = new Date(date);
      } else if (date.toDate && typeof date.toDate === 'function') {
        // Handle Firestore Timestamp
        dateObj = date.toDate();
      } else {
        return '';
      }

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return '';
      }

      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Error formatting date:', error);
      return '';
    }
  };

  // Helper function to get file type icon and color
  const getFileTypeInfo = (file) => {
    const type = file.type.toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (type.startsWith('image/')) {
      return { icon: '🖼️', color: 'bg-green-100 dark:bg-green-900', label: 'Image' };
    } else if (type.includes('pdf') || extension === 'pdf') {
      return { icon: '📄', color: 'bg-red-100 dark:bg-red-900', label: 'PDF' };
    } else if (type.includes('word') || ['doc', 'docx'].includes(extension)) {
      return { icon: '📝', color: 'bg-blue-100 dark:bg-blue-900', label: 'Document' };
    } else if (type.includes('excel') || type.includes('spreadsheet') || ['xls', 'xlsx'].includes(extension)) {
      return { icon: '📊', color: 'bg-green-100 dark:bg-green-900', label: 'Spreadsheet' };
    } else if (type.includes('text') || extension === 'txt') {
      return { icon: '📋', color: 'bg-gray-100 dark:bg-gray-900', label: 'Text' };
    } else {
      return { icon: '📎', color: 'bg-purple-100 dark:bg-purple-900', label: 'File' };
    }
  };

  useEffect(() => {
    console.log('🔄 AddProduct component mounted/updated');
    console.log('📦 productToEdit received:', productToEdit);
    console.log('📦 productToEdit type:', typeof productToEdit);
    console.log('📦 productToEdit keys:', productToEdit ? Object.keys(productToEdit) : 'null');

    const initializeComponent = async () => {
      setSuppliersLoading(true);
      setBrandsLoading(true);
      setCategoriesLoading(true);
      await Promise.all([loadSuppliers(), loadBrands(), loadCategories()]);
      setSuppliersLoading(false);
      setBrandsLoading(false);
      setCategoriesLoading(false);
    };

    initializeComponent();

    // Add visibility change listener to refresh data when user returns to page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible, refreshing suppliers...');
        loadSuppliers();
      }
    };

    const handleFocus = () => {
      console.log('🔄 Window focused, refreshing suppliers...');
      loadSuppliers();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Separate useEffect for handling productToEdit
  useEffect(() => {
    if (productToEdit) {
      console.log('🔄 Populating form with product data:', productToEdit);
      console.log('🔍 Product fields available:', Object.keys(productToEdit));
      console.log('🔍 Product name:', productToEdit.name);
      console.log('🔍 Product categoryId:', productToEdit.categoryId || productToEdit.category_id);
      console.log('🔍 Product brandId:', productToEdit.brandId || productToEdit.brand_id);

      const newFormData = {
        ...productToEdit,
        // Handle both old 'brand' field and new 'brandId' field for backward compatibility
        brandId: productToEdit.brandId || productToEdit.brand_id || '',
        // Handle category field - use categoryId for form (not category name)
        categoryId: productToEdit.categoryId || productToEdit.category_id || '',
        // Handle image URLs
        imageUrls: productToEdit.imageUrls || productToEdit.image_urls || [],
        expiryDate: formatDateForInput(productToEdit.expiryDate || productToEdit.expiry_date),
        manufacturingDate: formatDateForInput(productToEdit.manufacturingDate || productToEdit.manufacturing_date),
        // Handle other snake_case to camelCase mappings
        batchNo: productToEdit.batchNo || productToEdit.batch_no || '',
        purchasePrice: productToEdit.purchasePrice || productToEdit.purchase_price || '',
        salePrice: productToEdit.salePrice || productToEdit.sale_price || '',
        minStockLevel: productToEdit.minStockLevel || productToEdit.min_stock_level || '10',
        supplierId: productToEdit.supplierId || productToEdit.supplier_id || '',
        gstRate: productToEdit.gstRate || productToEdit.gst_rate || '',
        hsn: productToEdit.hsn || productToEdit.hsn_code || ''
      };

      console.log('📋 New form data created:', newFormData);
      setFormData(newFormData);

      // Load existing attachments for editing
      if (productToEdit.attachments && Array.isArray(productToEdit.attachments)) {
        console.log('📎 Loading existing attachments:', productToEdit.attachments);
        setUploadedFiles(productToEdit.attachments);
      } else if (productToEdit.imageUrls && Array.isArray(productToEdit.imageUrls)) {
        // Convert imageUrls to attachment format for backward compatibility
        const imageAttachments = productToEdit.imageUrls.map((url, index) => ({
          name: `image_${index + 1}.jpg`,
          url: url,
          type: 'image/jpeg',
          size: 0, // Unknown size for existing images
          metadata: {
            uploadedAt: productToEdit.created_at || new Date().toISOString(),
            originalName: `image_${index + 1}.jpg`,
            isExisting: true // Flag to identify existing files
          }
        }));
        console.log('🖼️ Converting imageUrls to attachments:', imageAttachments);
        setUploadedFiles(imageAttachments);
      }

      console.log('✅ Form data populated for editing');
      console.log('📋 Final form data summary:', {
        name: newFormData.name,
        categoryId: newFormData.categoryId,
        brandId: newFormData.brandId,
        type: newFormData.type,
        batchNo: newFormData.batchNo,
        attachments: newFormData.attachments?.length || 0,
        imageUrls: newFormData.imageUrls?.length || 0
      });
    }
  }, [productToEdit]);

  const loadSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      console.log('🔄 Loading suppliers from database...');

      // Try direct database query first to debug
      const { data: directData, error: directError } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      console.log('📊 Direct database query result:', { directData, directError });
      console.log('📊 Direct suppliers count:', directData?.length || 0);

      // Try to load from database service
      const data = await suppliersService.getAll();
      console.log('📊 Service suppliers loaded:', data);
      console.log('📊 Service suppliers count:', data?.length || 0);

      // Use service data if available, otherwise use direct data
      const suppliersData = (data && data.length > 0) ? data : (directData || []);
      console.log('📊 Final suppliers data to process:', suppliersData);

      if (suppliersData && suppliersData.length > 0) {
        // Ensure each supplier has an id field and normalize data
        const validSuppliers = suppliersData.map(supplier => ({
          id: supplier.id || supplier._id || supplier.supplierId || `sup_${Date.now()}_${Math.random()}`,
          name: supplier.name || 'Unknown Supplier',
          phone: supplier.phone || '',
          email: supplier.email || '',
          address: supplier.address || '',
          contactPerson: supplier.contactPerson || supplier.contact_person || '',
          gstNumber: supplier.gstNumber || supplier.gst_number || '',
          isActive: supplier.isActive !== false && supplier.is_active !== false // Default to true if not specified
        }));

        console.log('✅ Setting database suppliers:', validSuppliers);
        console.log('✅ Final suppliers count:', validSuppliers.length);
        setSuppliers(validSuppliers);
      } else {
        console.log('📦 No suppliers found in database, using fallback data');
        // Fallback to mock data if database is empty
        const mockSuppliers = [
          { id: 'sup1', name: 'Tata Chemicals Ltd', phone: '+91-9876543210', email: 'contact@tatachemicals.com' },
          { id: 'sup2', name: 'IFFCO Distributors', phone: '+91-9876543211', email: 'sales@iffco.com' },
          { id: 'sup3', name: 'Green Gold Organics', phone: '+91-9876543212', email: 'info@greengold.com' },
          { id: 'sup4', name: 'Coromandel International', phone: '+91-9876543213', email: 'support@coromandel.com' }
        ];
        setSuppliers(mockSuppliers);
      }
    } catch (error) {
      console.error('❌ Error loading suppliers:', error);
      console.log('🔄 Using fallback mock suppliers due to error');

      // Fallback to mock data on error
      const fallbackSuppliers = [
        { id: 'sup1', name: 'Tata Chemicals Ltd', phone: '+91-9876543210', email: 'contact@tatachemicals.com' },
        { id: 'sup2', name: 'IFFCO Distributors', phone: '+91-9876543211', email: 'sales@iffco.com' },
        { id: 'sup3', name: 'Green Gold Organics', phone: '+91-9876543212', email: 'info@greengold.com' },
        { id: 'sup4', name: 'Coromandel International', phone: '+91-9876543213', email: 'support@coromandel.com' },
        { id: 'sup5', name: 'Default Supplier', phone: '+91-9876543214', email: 'default@supplier.com' }
      ];
      setSuppliers(fallbackSuppliers);
    } finally {
      setSuppliersLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      setBrandsLoading(true);
      console.log('🔄 Loading brands...');

      // Always use mock data for now to ensure brands are available
      const mockBrands = [
        { id: 'brand1', name: 'Tata Chemicals' },
        { id: 'brand2', name: 'IFFCO' },
        { id: 'brand3', name: 'Coromandel' },
        { id: 'brand4', name: 'Krishak Bharati' },
        { id: 'brand5', name: 'Nagarjuna Fertilizers' }
      ];

      setBrands(mockBrands);
      setBrandsLoading(false);

      // Try to load from database in background (optional)
      try {
        const data = await brandsService.getAll();
        console.log('📊 Database brands loaded:', data);
        if (data && data.length > 0) {
          // Ensure each brand has an id field
          const validBrands = data.map(brand => ({
            ...brand,
            id: brand.id || brand._id || brand.brandId || `brand_${Date.now()}_${Math.random()}`
          }));
          console.log('🔄 Updating with database brands:', validBrands);
          setBrands(validBrands);
        }
      } catch (dbError) {
        console.warn('⚠️ Database brands not available, using mock data:', dbError.message);
      }
    } catch (error) {
      console.error('❌ Error loading brands:', error);
      // Fallback to basic mock data
      setBrands([
        { id: 'brand1', name: 'Default Brand' }
      ]);
      setBrandsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('🔄 Loading categories - prioritizing config categories...');

      // First, try to load from database
      const dbData = await getDatabaseCategories();

      // Check if database has the correct config categories
      const configCategoryNames = CATEGORIES; // ['Chemical Fertilizer', 'Organic Fertilizer', etc.]
      const dbCategoryNames = dbData?.map(cat => cat.name) || [];

      // Check if database categories match config categories
      const hasConfigCategories = configCategoryNames.every(configName =>
        dbCategoryNames.some(dbName => dbName.toLowerCase() === configName.toLowerCase())
      );

      if (dbData && dbData.length > 0 && hasConfigCategories) {
        console.log('✅ Database has correct config categories:', dbData);
        setCategories(dbData);
      } else {
        console.log('📦 Database categories don\'t match config. Using config categories:', configCategoryNames);
        // Use config categories as the source of truth
        const configCategories = CATEGORIES.map((name, index) => ({
          id: `cat_${index + 1}`,
          name: name,
          description: `${name} products`,
          is_active: true,
          sort_order: index + 1
        }));
        setCategories(configCategories);

        console.log('✅ Using config categories:', configCategories);
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      console.log('📦 Using config categories as fallback');
      // Always fallback to config categories
      const configCategories = CATEGORIES.map((name, index) => ({
        id: `cat_${index + 1}`,
        name: name,
        description: `${name} products`,
        is_active: true,
        sort_order: index + 1
      }));
      setCategories(configCategories);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'attachments' && files) {
      handleFileUpload(Array.from(files));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle category change with auto-population
  const handleCategoryChange = (categoryId) => {
    // Find the category name for helper functions
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    const categoryName = selectedCategory ? selectedCategory.name : '';

    setFormData(prev => ({
      ...prev,
      categoryId: categoryId, // Store as categoryId for database
      type: '', // Reset type when category changes
      gstRate: getSuggestedGSTRate(categoryName).toString() // Auto-populate GST rate using category name
    }));

    // Clear category error
    if (errors.categoryId) {
      setErrors(prev => ({
        ...prev,
        categoryId: ''
      }));
    }
  };

  // Handle type change with auto-population
  const handleTypeChange = (type) => {
    // Get category name for HSN lookup (helper functions still use names)
    const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
    const categoryName = selectedCategory ? selectedCategory.name : '';
    const hsnCode = getHSNCode(categoryName, type);
    setFormData(prev => ({
      ...prev,
      type: type,
      hsn: hsnCode || prev.hsn // Auto-populate HSN if available
    }));

    // Clear type error
    if (errors.type) {
      setErrors(prev => ({
        ...prev,
        type: ''
      }));
    }
  };

  // Supabase Storage upload with enhanced error handling
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    console.log('🔄 Starting enhanced Supabase Storage upload...', files);

    try {
      setUploading(true);
      setUploadProgress({});
      const uploadResults = [];

      // First, test storage access and authentication
      console.log('🧪 Testing storage access before upload...');
      const storageTest = await storageService.testStorage();
      console.log('📊 Storage test results:', storageTest);

      if (storageTest.overall === 'failed') {
        throw new Error(`Storage access not available. Please check your authentication and try again. Error: ${storageTest.error || 'Unknown error'}`);
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📁 Processing file ${i + 1}/${files.length}:`, {
          name: file.name,
          size: file.size,
          type: file.type
        });

        // Basic validation
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
          continue;
        }

        // Initialize progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));

        try {
          // Use enhanced Supabase Storage service
          console.log('🚀 Starting authenticated Supabase upload...');

          const uploadResult = await storageService.uploadFile(
            file,
            'products/images/', // Use specific folder for product images
            (progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: progress
              }));
            }
          );

          console.log('✅ Upload completed:', uploadResult);

          const fileData = {
            name: file.name,
            url: uploadResult.url,
            path: uploadResult.path,
            type: file.type,
            size: file.size,
            metadata: {
              uploadedAt: new Date().toISOString(),
              originalName: file.name,
              bucket: uploadResult.bucket
            }
          };

          uploadResults.push(fileData);

          // If this is an image file, add it to the product's image URLs
          if (file.type.startsWith('image/')) {
            setFormData(prev => ({
              ...prev,
              imageUrls: [...(prev.imageUrls || []), uploadResult.url]
            }));
            console.log('📸 Added image URL to product:', uploadResult.url);
          }

          // Set progress to 100%
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));

          console.log('✅ File processed successfully:', file.name);

        } catch (error) {
          console.error('❌ Supabase upload failed for:', file.name, error);

          // Provide specific error messages with guidance
          let errorMessage = `Failed to upload "${file.name}": `;
          if (error.message && error.message.includes('Permission denied')) {
            errorMessage += 'Permission denied. Please check your login status and try refreshing the page.';
          } else if (error.message && error.message.includes('Authentication failed')) {
            errorMessage += 'Authentication issue. Please log out and log back in, then try again.';
          } else if (error.message && error.message.includes('payload too large')) {
            errorMessage += 'File too large. Please choose a smaller file (max 10MB).';
          } else if (error.message && error.message.includes('bucket')) {
            errorMessage += 'Storage configuration issue. Please contact support.';
          } else {
            errorMessage += error.message || 'Unknown error occurred.';
          }

          // Show error in UI instead of alert for better UX
          setSaveStatus('error');
          setSaveMessage(errorMessage);

          // Remove failed file from progress
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }
      }

      if (uploadResults.length > 0) {
        console.log('📋 Updating state with uploaded files:', uploadResults);

        // Update uploaded files state
        setUploadedFiles(prev => [...prev, ...uploadResults]);

        // Update form data with file URLs
        setFormData(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), ...uploadResults],
          imageUrls: [...(prev.imageUrls || []), ...uploadResults.filter(file => file.type.startsWith('image/')).map(file => file.url)]
        }));

        console.log('🎉 Upload process completed!');
        
        // Show success message in UI
        setSaveStatus('success');
        setSaveMessage(`Successfully uploaded ${uploadResults.length} file(s)!`);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveStatus('');
          setSaveMessage('');
        }, 3000);
      } else {
        console.log('⚠️ No files were uploaded successfully');
        
        // Show error message in UI
        setSaveStatus('error');
        setSaveMessage('No files were uploaded. Please check your authentication and try again.');
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          setSaveStatus('');
          setSaveMessage('');
        }, 5000);
      }

    } catch (error) {
      console.error('💥 Error in upload process:', error);
      
      // Show error message in UI
      setSaveStatus('error');
      setSaveMessage(`Upload failed: ${error.message}. Please check your authentication and try again.`);
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSaveStatus('');
        setSaveMessage('');
      }, 5000);
    } finally {
      console.log('🏁 Cleaning up upload state...');
      setUploading(false);
      // Clear progress after a short delay
      setTimeout(() => {
        setUploadProgress({});
        console.log('🧹 Progress cleared');
      }, 2000);
    }
  };

  const removeFile = async (fileIndex) => {
    const fileToRemove = uploadedFiles[fileIndex];

    if (!fileToRemove) {
      console.error('File not found at index:', fileIndex);
      return;
    }

    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${fileToRemove.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      console.log('🗑️ Removing file:', fileToRemove.name);
      setUploading(true); // Show loading state during deletion

      // Delete from Supabase Storage if it has a path or URL
      if (fileToRemove.path) {
        console.log('🔄 Deleting from Supabase Storage using path:', fileToRemove.path);
        await storageService.deleteFile(fileToRemove.path);
        console.log('✅ File deleted from storage');
      } else if (fileToRemove.url && !fileToRemove.metadata?.isExisting) {
        // Try to extract path from URL for newly uploaded files
        try {
          const urlParts = fileToRemove.url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const possiblePath = `products/images/${fileName}`;
          console.log('🔄 Attempting to delete using extracted path:', possiblePath);
          await storageService.deleteFile(possiblePath);
          console.log('✅ File deleted from storage using extracted path');
        } catch (pathError) {
          console.warn('⚠️ Could not delete file from storage using URL:', pathError);
          // Continue with local removal even if storage deletion fails
        }
      } else if (fileToRemove.metadata?.isExisting) {
        console.log('ℹ️ Skipping storage deletion for existing file (will be handled on save)');
      }

      // Remove from uploadedFiles state
      setUploadedFiles(prev => {
        const newFiles = prev.filter((_, index) => index !== fileIndex);
        console.log('📋 Updated uploaded files:', newFiles.length, 'remaining');
        return newFiles;
      });

      // Remove from form data attachments
      setFormData(prev => ({
        ...prev,
        attachments: prev.attachments.filter((_, index) => index !== fileIndex)
      }));

      // If it's an image, also remove from imageUrls
      if (fileToRemove.type && fileToRemove.type.startsWith('image/') && fileToRemove.url) {
        setFormData(prev => ({
          ...prev,
          imageUrls: (prev.imageUrls || []).filter(url => url !== fileToRemove.url)
        }));
        console.log('🖼️ Removed image URL from product');
      }

      console.log('✅ File removed successfully:', fileToRemove.name);

      // Show success message
      setSaveStatus('success');
      setSaveMessage(`File "${fileToRemove.name}" deleted successfully!`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus('');
        setSaveMessage('');
      }, 3000);

    } catch (error) {
      console.error('❌ Error removing file:', error);

      // Show specific error messages
      let errorMessage = `Failed to delete "${fileToRemove.name}": `;
      if (error.message && error.message.includes('not found')) {
        errorMessage += 'File not found in storage (may have been already deleted).';
        // Still remove from local state even if storage deletion fails
        setUploadedFiles(prev => prev.filter((_, index) => index !== fileIndex));
        setFormData(prev => ({
          ...prev,
          attachments: prev.attachments.filter((_, index) => index !== fileIndex)
        }));
      } else if (error.message && error.message.includes('Permission denied')) {
        errorMessage += 'Permission denied. Please check your access rights.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }

      setSaveStatus('error');
      setSaveMessage(errorMessage);

      // Clear error message after 5 seconds
      setTimeout(() => {
        setSaveStatus('');
        setSaveMessage('');
      }, 5000);
    } finally {
      setUploading(false);
    }
  };

  // Bulk delete all files
  const removeAllFiles = async () => {
    if (uploadedFiles.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete all ${uploadedFiles.length} files?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      console.log('🗑️ Bulk deleting all files...');
      setUploading(true);

      const deletePromises = uploadedFiles.map(async (file, index) => {
        try {
          if (file.path) {
            await storageService.deleteFile(file.path);
            console.log(`✅ Deleted file ${index + 1}/${uploadedFiles.length}:`, file.name);
          }
        } catch (error) {
          console.error(`❌ Failed to delete file ${file.name}:`, error);
          // Continue with other deletions even if one fails
        }
      });

      // Wait for all deletions to complete
      await Promise.allSettled(deletePromises);

      // Clear all files from state
      setUploadedFiles([]);
      setFormData(prev => ({
        ...prev,
        attachments: [],
        imageUrls: [] // Clear all image URLs as well
      }));

      console.log('✅ All files deleted successfully');
      setSaveStatus('success');
      setSaveMessage(`All ${uploadedFiles.length} files deleted successfully!`);

      setTimeout(() => {
        setSaveStatus('');
        setSaveMessage('');
      }, 3000);

    } catch (error) {
      console.error('❌ Error during bulk deletion:', error);
      setSaveStatus('error');
      setSaveMessage('Some files could not be deleted. Please try again.');

      setTimeout(() => {
        setSaveStatus('');
        setSaveMessage('');
      }, 5000);
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Debug form data
    console.log('Validating form data:', formData);

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.type) newErrors.type = 'Product type is required';
    if (!formData.categoryId.trim()) newErrors.categoryId = 'Category is required';
    if (!formData.brandId) newErrors.brandId = 'Brand is required';
    if (!formData.batchNo.trim()) newErrors.batchNo = 'Batch number is required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    if (!formData.purchasePrice || formData.purchasePrice <= 0) {
      newErrors.purchasePrice = 'Valid purchase price is required';
    }
    if (!formData.salePrice || formData.salePrice <= 0) {
      newErrors.salePrice = 'Valid sale price is required';
    }
    if (formData.quantity === '' || formData.quantity < 0) {
      newErrors.quantity = 'Valid quantity is required';
    }
    if (!formData.minStockLevel || formData.minStockLevel < 0) {
      newErrors.minStockLevel = 'Valid minimum stock level is required';
    }
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (!formData.supplierId || formData.supplierId.trim() === '') {
      newErrors.supplierId = 'Supplier is required';
      console.log('Supplier validation failed. Current supplierId:', formData.supplierId, 'Available suppliers:', suppliers.length);
    } else {
      // Check if the selected supplier ID exists in the suppliers list
      const supplierExists = suppliers.find(s => s.id === formData.supplierId);
      if (!supplierExists) {
        newErrors.supplierId = 'Selected supplier is invalid';
        console.log('Invalid supplier ID:', formData.supplierId, 'Available IDs:', suppliers.map(s => s.id));
      }
    }

    // Optional but recommended fields
    if (formData.hsn && !/^\d{4,8}$/.test(formData.hsn)) {
      newErrors.hsn = 'HSN should be 4-8 digits';
    }
    if (formData.gstRate && (Number(formData.gstRate) < 0 || Number(formData.gstRate) > 28)) {
      newErrors.gstRate = 'GST rate should be between 0 and 28%';
    }

    // Check if sale price is greater than purchase price
    if (formData.salePrice && formData.purchasePrice &&
        parseFloat(formData.salePrice) <= parseFloat(formData.purchasePrice)) {
      newErrors.salePrice = 'Sale price should be greater than purchase price';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous status and show saving state
    setSaveStatus('saving');
    setSaveMessage('Saving product...');

    if (!validateForm()) {
      setSaveStatus('error');
      setSaveMessage('Please fix the validation errors above.');
      return;
    }

    setLoading(true);

    try {
      // Debug: Check authentication state
      console.log('Current user:', currentUser);
      console.log('User profile:', userProfile);
      console.log('User role:', userProfile?.role);
      console.log('Is manager:', isManager);

      // Check if user is authenticated
      if (!currentUser) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Check if user profile exists
      if (!userProfile) {
        throw new Error('User profile not found. Please refresh the page and try again.');
      }

      // Validate required numeric fields
      const purchasePrice = parseFloat(formData.purchasePrice);
      const salePrice = parseFloat(formData.salePrice);
      const quantity = parseInt(formData.quantity);
      const minStockLevel = parseInt(formData.minStockLevel);
      const gstRate = formData.gstRate ? parseFloat(formData.gstRate) : 0;

      if (isNaN(purchasePrice) || isNaN(salePrice) || isNaN(quantity) || isNaN(minStockLevel)) {
        throw new Error('Invalid numeric values in form data');
      }

      // Validate dates
      const expiryDate = new Date(formData.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        throw new Error('Invalid expiry date');
      }

      const manufacturingDate = formData.manufacturingDate ? new Date(formData.manufacturingDate) : null;
      if (formData.manufacturingDate && isNaN(manufacturingDate.getTime())) {
        throw new Error('Invalid manufacturing date');
      }

      // Prepare attachments data for database (JSONB format)
      const attachmentsForDb = (uploadedFiles || []).map(file => ({
        name: file.name,
        url: file.url,
        path: file.path,
        type: file.type,
        size: file.size,
        metadata: file.metadata || {},
        uploadedAt: file.metadata?.uploadedAt || new Date().toISOString()
      }));

      // Extract image URLs from attachments for backward compatibility
      const imageUrlsFromAttachments = attachmentsForDb
        .filter(file => file.type.startsWith('image/'))
        .map(file => file.url);

      const productData = {
        name: formData.name.trim(),
        type: formData.type,
        category_id: formData.categoryId, // Send categoryId to match database schema
        brand_id: formData.brandId, // Changed from 'brand' to 'brandId' to match database schema
        batchNo: formData.batchNo.trim(),
        expiryDate: expiryDate,
        purchasePrice: purchasePrice,
        salePrice: salePrice,
        quantity: quantity,
        minStockLevel: minStockLevel,
        unit: formData.unit,
        supplierId: formData.supplierId,
        hsn: formData.hsn.trim(),
        gstRate: gstRate,
        barcode: formData.barcode.trim(),
        manufacturingDate: manufacturingDate,
        description: formData.description.trim(),
        imageUrls: [...(formData.imageUrls || []), ...imageUrlsFromAttachments], // Include both existing and new image URLs
        attachments: attachmentsForDb, // JSONB array of attachment objects
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Product data to save:', productData);

      let productId = productToEdit?.id;
      if (productToEdit) {
        // Update existing product
        console.log('Updating product with ID:', productToEdit.id);
        await productsService.update(productToEdit.id, productData);
        productId = productToEdit.id;
      } else {
        // Add new product
        console.log('Adding new product...');
        console.log('User attempting to add product:', {
          uid: currentUser.uid,
          role: userProfile.role,
          isManager: isManager
        });
        productId = await productsService.add(productData);
        console.log('Product added with ID:', productId);
      }

      // Note: File attachments are now handled through the separate file upload system
      // using Supabase Storage via the handleFileUpload function

      // Show success feedback
      setSaveStatus('success');
      setSaveMessage(productToEdit ? 'Product updated successfully!' : 'Product added successfully!');

      // Navigate after a short delay to show success message
      setTimeout(() => {
        onNavigate('inventory');
      }, 2000);
    } catch (error) {
      console.error('Detailed error saving product:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      console.error('Form data at error:', formData);
      console.error('Current user at error:', currentUser);
      console.error('User profile at error:', userProfile);

      let errorMessage = 'Error saving product. ';
      if (error.code === 'permission-denied') {
        if (!productToEdit && userProfile?.role === 'staff') {
          errorMessage += 'Staff members can only update existing products. Please contact your manager to add new products, or ask them to upgrade your role permissions.';
        } else {
          errorMessage += 'You do not have permission to perform this action.';
        }
      } else if (error.code === 'unavailable') {
        errorMessage += 'Database is currently unavailable. Please check your internet connection.';
      } else if (error.code === 'unauthenticated') {
        errorMessage += 'You are not logged in. Please log in and try again.';
      } else if (error.message && error.message.includes('upload')) {
        errorMessage += 'File upload failed. The product was saved but attachments could not be uploaded. Please try uploading files later.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }

      // Show error feedback in UI instead of alert
      setSaveStatus('error');
      setSaveMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get available types based on selected category using config-first approach
  const getAvailableTypes = () => {
    if (formData.categoryId) {
      // Find the category object from loaded categories
      const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
      if (selectedCategory) {
        console.log('🔍 Getting types for category:', selectedCategory.name);

        // First try config types (exact match)
        const configTypes = getTypesForCategory(selectedCategory.name);
        if (configTypes && configTypes.length > 0) {
          console.log('✅ Found config types for category:', configTypes);
          return configTypes;
        }

        // Then try dynamic category types from database sync
        const dynamicTypes = getDynamicCategoryTypes(selectedCategory.name);
        if (dynamicTypes && dynamicTypes.length > 0) {
          console.log('✅ Found dynamic types for category:', dynamicTypes);
          return dynamicTypes;
        }

        console.log('⚠️ No types found for category:', selectedCategory.name);
      }
    }

    // Final fallback
    console.log('📦 Using default fertilizer types');
    return FERTILIZER_TYPES;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={() => onNavigate('inventory')}
        >
          ← Back to Inventory
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {productToEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {productToEdit ? 'Update product information' : 'Add a new fertilizer to your inventory'}
          </p>
        </div>
      </div>

      {/* Save Status Feedback */}
      {saveStatus && (
        <div className={`p-4 rounded-lg border ${
          saveStatus === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          saveStatus === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center">
            {saveStatus === 'saving' && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            )}
            {saveStatus === 'success' && (
              <div className="text-green-600 mr-2">✅</div>
            )}
            {saveStatus === 'error' && (
              <div className="text-red-600 mr-2">❌</div>
            )}
            <span className="font-medium">{saveMessage}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>
            Fill in the details for the fertilizer product
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Authentication Status */}
          <div className="mb-4 p-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground">
            <strong className="text-foreground">Auth Status:</strong> {currentUser ? `Authenticated as ${currentUser.email || currentUser.uid}` : 'Not authenticated'} |
            <strong className="text-foreground"> Profile:</strong> {userProfile ? `${userProfile.name} (${userProfile.role})` : 'No profile'} |
            <strong className="text-foreground"> Suppliers:</strong> {suppliers.length} loaded
          </div>

          {/* Permission Warning */}
          {!productToEdit && userProfile?.role === 'staff' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <strong>Permission Notice:</strong> As a staff member, you may only be able to update existing products. If you encounter permission errors when adding new products, please contact your manager.
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., NPK 20-20-20"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Brand *</label>
                <Select
                  value={formData.brandId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, brandId: value }))}
                >
                  <SelectTrigger className={errors.brandId ? 'border-red-500' : ''}>
                    <SelectValue placeholder={brandsLoading ? "Loading brands..." : "Select a brand"} />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.brandId && <span className="text-red-500 text-sm">{errors.brandId}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select
                  value={formData.categoryId}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <div className="px-2 py-1 text-sm text-gray-500">
                        Loading categories...
                      </div>
                    ) : (() => {
                      console.log('Rendering category dropdown with', categories.length, 'categories:', categories);
                      return categories.length > 0;
                    })() ? (
                      categories.map(category => {
                        console.log('Rendering category in dropdown:', category);
                        return (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <div className="px-2 py-1 text-sm text-gray-500">
                        No categories available
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.categoryId && <span className="text-red-500 text-sm">{errors.categoryId}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type *</label>
                <Select
                  value={formData.type}
                  onValueChange={handleTypeChange}
                  disabled={!formData.categoryId}
                >
                  <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                    <SelectValue placeholder={formData.categoryId ? "Select Type" : "Select Category First"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const availableTypes = getAvailableTypes();
                      console.log('Available types for dropdown:', availableTypes);
                      return availableTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
                {errors.type && <span className="text-red-500 text-sm">{errors.type}</span>}
                {formData.categoryId && (() => {
                  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
                  const availableTypes = getAvailableTypes();
                  return (
                    <p className="text-xs text-gray-500">
                      Showing {availableTypes.length} types for "{selectedCategory?.name || 'Selected Category'}"
                      {availableTypes.length === 0 && (
                        <span className="text-red-500 ml-2">⚠️ No types available</span>
                      )}
                    </p>
                  );
                })()}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Batch Number *</label>
                <Input
                  name="batchNo"
                  value={formData.batchNo}
                  onChange={handleChange}
                  placeholder="e.g., TC2024001"
                  className={errors.batchNo ? 'border-red-500' : ''}
                />
                {errors.batchNo && <span className="text-red-500 text-sm">{errors.batchNo}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Barcode / QR</label>
                <Input
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="Scan or enter barcode/QR code"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">HSN Code</label>
                <Input
                  name="hsn"
                  value={formData.hsn}
                  onChange={handleChange}
                  placeholder="e.g., 31051000"
                  className={errors.hsn ? 'border-red-500' : ''}
                />
                {errors.hsn && <span className="text-red-500 text-sm">{errors.hsn}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">GST Rate (%)</label>
                <Select
                  value={formData.gstRate}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gstRate: value }))}
                >
                  <SelectTrigger className={errors.gstRate ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select GST Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {GST_RATES.map(rate => (
                      <SelectItem key={rate} value={rate.toString()}>{rate}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gstRate && <span className="text-red-500 text-sm">{errors.gstRate}</span>}
                {formData.categoryId && (
                  <p className="text-xs text-gray-500">
                    Suggested: {getSuggestedGSTRate(categories.find(cat => cat.id === formData.categoryId)?.name || '')}% for {categories.find(cat => cat.id === formData.categoryId)?.name || 'Selected Category'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Date *</label>
                <Input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className={errors.expiryDate ? 'border-red-500' : ''}
                />
                {errors.expiryDate && <span className="text-red-500 text-sm">{errors.expiryDate}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Manufacturing Date</label>
                <Input
                  type="date"
                  name="manufacturingDate"
                  value={formData.manufacturingDate}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Purchase Price (₹) *</label>
                <Input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className={errors.purchasePrice ? 'border-red-500' : ''}
                />
                {errors.purchasePrice && <span className="text-red-500 text-sm">{errors.purchasePrice}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sale Price (₹) *</label>
                <Input
                  type="number"
                  name="salePrice"
                  value={formData.salePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className={errors.salePrice ? 'border-red-500' : ''}
                />
                {errors.salePrice && <span className="text-red-500 text-sm">{errors.salePrice}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity *</label>
                <Input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && <span className="text-red-500 text-sm">{errors.quantity}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Unit *</label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger className={errors.unit ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit && <span className="text-red-500 text-sm">{errors.unit}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Stock Level *</label>
                <Input
                  type="number"
                  name="minStockLevel"
                  value={formData.minStockLevel}
                  onChange={handleChange}
                  placeholder="10"
                  className={errors.minStockLevel ? 'border-red-500' : ''}
                />
                {errors.minStockLevel && <span className="text-red-500 text-sm">{errors.minStockLevel}</span>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Supplier *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      ({suppliers.length} suppliers)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        console.log('🔄 Manual supplier refresh triggered');
                        loadSuppliers();
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                <Select
                  value={formData.supplierId}
                  disabled={suppliersLoading}
                  onValueChange={(value) => {
                    console.log('Supplier selected:', value, 'Type:', typeof value);
                    console.log('Available suppliers:', suppliers);
                    const selectedSupplier = suppliers.find(s => s.id === value);
                    console.log('Selected supplier object:', selectedSupplier);

                    setFormData(prev => {
                      const newData = { ...prev, supplierId: value };
                      console.log('Updated form data:', newData);
                      return newData;
                    });

                    // Clear error when supplier is selected
                    if (errors.supplierId) {
                      setErrors(prev => ({ ...prev, supplierId: '' }));
                    }
                  }}
                >
                  <SelectTrigger className={errors.supplierId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliersLoading ? (
                      <div className="px-2 py-1 text-sm text-gray-500">
                        Loading suppliers...
                      </div>
                    ) : (() => {
                      console.log('Rendering supplier dropdown with', suppliers.length, 'suppliers:', suppliers);
                      return suppliers.length > 0;
                    })() ? (
                      suppliers.map(supplier => {
                        console.log('Rendering supplier in dropdown:', supplier);
                        return (
                          <SelectItem
                            key={supplier.id}
                            value={supplier.id}
                            className="cursor-pointer hover:bg-accent"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{supplier.name}</span>
                              {supplier.phone && (
                                <span className="text-xs text-muted-foreground">{supplier.phone}</span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })
                    ) : (
                      <div className="px-2 py-1 text-sm text-gray-500">
                        No suppliers available
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.supplierId && <span className="text-red-500 text-sm">{errors.supplierId}</span>}
                {!suppliersLoading && suppliers.length === 0 && (
                  <p className="text-xs text-amber-600">
                    No suppliers found. Please add suppliers first.
                  </p>
                )}
                {/* Success indicator when supplier is selected */}
                {formData.supplierId && suppliers.length > 0 && (
                  <div className="text-xs text-green-600 mt-1">
                    ✓ Selected: {suppliers.find(s => s.id === formData.supplierId)?.name || 'Unknown supplier'}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Additional product details..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md resize-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Attachments (Images, Documents)</label>
                {uploadedFiles.length > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
                  </span>
                )}
              </div>

              <div className="relative">
                <Input
                  type="file"
                  name="attachments"
                  accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
                  multiple
                  onChange={handleChange}
                  disabled={uploading}
                  className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:file:bg-gray-100 disabled:file:text-gray-400"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center rounded-md">
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Processing...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  📎 Supported: JPG, PNG, GIF, PDF, DOC, DOCX, TXT, Excel (Max: 10MB each)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      console.log('🧪 Testing Supabase Storage connection...');
                      
                      // Test storage access first
                      const storageTest = await storageService.testStorage();
                      console.log('📊 Storage test results:', storageTest);
                      
                      if (storageTest.overall === 'failed') {
                        throw new Error(`Storage access failed: ${storageTest.error || 'Unknown error'}`);
                      }
                      
                      // Try actual upload test
                      const testData = new Blob(['test'], { type: 'text/plain' });
                      const testFile = new File([testData], 'test.txt', { type: 'text/plain' });
                      await storageService.uploadFile(testFile, 'test/');
                      
                      console.log('✅ Supabase Storage is working!');
                      alert('✅ Supabase Storage connection is working!\n\nAuthentication: ✅\nUpload access: ✅\nYou can now upload files.');
                    } catch (error) {
                      console.error('❌ Supabase Storage test failed:', error);
                      alert(`❌ Storage test failed: ${error.message}\n\nPlease check:\n1. You are logged in\n2. Your authentication is active\n3. Storage buckets are configured`);
                    }
                  }}
                  className="text-xs"
                >
                  Test Storage
                </Button>
              </div>

              {/* No files uploaded message */}
              {uploadedFiles.length === 0 && !uploading && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="text-4xl mb-2">📎</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    No files uploaded yet
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Upload files above to see delete options here
                  </p>
                </div>
              )}

              {/* Upload Progress */}
              {Object.keys(uploadProgress).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(uploadProgress).map(([fileName, progress]) => (
                    <div key={fileName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="truncate">{fileName}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length}):</p>
                    {uploadedFiles.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeAllFiles}
                        className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                        disabled={uploading}
                        title="Delete all uploaded files"
                      >
                        🗑️ Delete All
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {file.type.startsWith('image/') ? (
                              <div className="relative">
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="w-12 h-12 object-cover rounded-md border border-gray-300 shadow-sm"
                                />
                                <div className={`absolute -top-1 -right-1 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center shadow-sm ${
                                  file.metadata?.isExisting ? 'bg-blue-500' : 'bg-green-500'
                                }`}>
                                  {file.metadata?.isExisting ? '📁' : '✓'}
                                </div>
                              </div>
                            ) : (
                              <div className={`w-12 h-12 ${getFileTypeInfo(file).color} rounded-md flex items-center justify-center border border-gray-300 shadow-sm`}>
                                <span className="text-2xl">{getFileTypeInfo(file).icon}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {file.name}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>{storageService.formatFileSize(file.size)}</span>
                              <span>•</span>
                              <span className="capitalize">
                                {getFileTypeInfo(file).label}
                              </span>
                              {file.metadata?.uploadedAt && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {file.metadata?.isExisting ? 'Existing file' : `Uploaded ${new Date(file.metadata.uploadedAt).toLocaleTimeString()}`}
                                  </span>
                                </>
                              )}
                              {file.metadata?.isExisting && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                                    📁 Existing
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {file.url && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(file.url, '_blank')}
                              className="text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                              title="View file"
                            >
                              👁️ View
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                            disabled={uploading}
                            title="Delete file"
                          >
                            🗑️ Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md space-y-1">
                    <div>
                      💡 <strong>Tip:</strong> Click "View" to preview files, or "Delete" to remove unwanted uploads.
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                        <span>✓ New uploads</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
                        <span>📁 Existing files</span>
                      </span>
                    </div>
                    <div>
                      Changes are saved when you click "Update Product" or "Add Product".
                    </div>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Uploading files...</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUploading(false);
                      setUploadProgress({});
                      console.log('🛑 Upload cancelled by user');
                    }}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-6">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? 'Saving...' : (productToEdit ? 'Update Product' : 'Add Product')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  console.log('=== DEBUG INFO ===');
                  console.log('Current User:', currentUser);
                  console.log('User Profile:', userProfile);
                  console.log('Form Data:', formData);
                  console.log('Suppliers:', suppliers);
                  console.log('Validation Result:', validateForm());
                  console.log('==================');
                }}
              >
                Debug Info
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate('inventory')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProduct;
