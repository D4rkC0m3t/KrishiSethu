import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { customersService, salesService, productsService } from '../lib/supabaseDb';
import { supabase } from '../lib/supabase';
import { shopDetailsService } from '../lib/shopDetails';
import { imageService } from '../lib/imageService';
import { barcodeService } from '../lib/barcodeService';
import { thermalPrintService } from '../lib/thermalPrintService';
import { gstService } from '../lib/gstService';
import BarcodeScanner from './BarcodeScanner';
import offlineStorage from '../lib/offlineStorage';
import { notificationService } from '../lib/notificationService';
import { EmptyProducts } from './EmptyState';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Printer,
  Calculator,
  Search,
  Package,
  Receipt,
  DollarSign,
  Percent,
  Clock,
  CheckCircle,
  AlertCircle,
  Scan,
  UserPlus,
  Settings,
  Tag,
  Gift,
  Camera,
  QrCode,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  TrendingUp,
  ScanLine,
  BarChart3,
  Upload,
  Share2,
  MessageCircle,
  Copy,
  Download
} from 'lucide-react';
import QRCode from 'qrcode';

const POS = ({ onNavigate }) => {
  // Helper function to format address
  const formatAddress = (address) => {
    if (!address) return '';
    if (typeof address === 'string') return address;

    const parts = [
      address.street,
      address.city,
      address.state,
      address.pincode
    ].filter(part => part && part.trim() !== '');

    return parts.join(', ');
  };

  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [shopDetails, setShopDetails] = useState(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showCustomerSelectDialog, setShowCustomerSelectDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [currentBillNumber, setCurrentBillNumber] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'amount'
  const [discountReason, setDiscountReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const receiptRef = useRef();
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    city: '',
    pincode: '',
    gstNumber: '',
    creditLimit: 0,
    notes: ''
  });
  const [paymentData, setPaymentData] = useState({
    method: 'cash',
    cardNumber: '',
    upiId: '',
    amountReceived: 0
  });
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);
  const [selectedProductForUpload, setSelectedProductForUpload] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [customGSTRate, setCustomGSTRate] = useState(null); // For overriding GST rate
  const [showGSTDialog, setShowGSTDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Generate bill number
  const generateBillNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const time = Date.now().toString().slice(-6);
    return `BILL${year}${month}${day}${time}`;
  };

  // Convert number to words (Indian format)
  const numberToWordsIndian = (num) => {
    if (num === 0) return 'Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertHundreds = (n) => {
      let result = '';
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result;
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result;
    };

    let result = '';
    let crore = Math.floor(num / 10000000);
    if (crore > 0) {
      result += convertHundreds(crore) + 'Crore ';
      num %= 10000000;
    }

    let lakh = Math.floor(num / 100000);
    if (lakh > 0) {
      result += convertHundreds(lakh) + 'Lakh ';
      num %= 100000;
    }

    let thousand = Math.floor(num / 1000);
    if (thousand > 0) {
      result += convertHundreds(thousand) + 'Thousand ';
      num %= 1000;
    }

    if (num > 0) {
      result += convertHundreds(num);
    }

    return result.trim();
  };

  // Initialize bill number and load products data
  useEffect(() => {
    setCurrentBillNumber(generateBillNumber());
    
    // FORCE CLEAR ALL OLD CACHES - Remove old images completely
    if (imageService && imageService.clearCache) {
      imageService.clearCache();
      console.log('✅ In-memory cache cleared');
    }
    
    // Clear ALL localStorage image caches
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('image') || key.includes('cache') || key.includes('fetch'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`✅ Cleared ${keysToRemove.length} localStorage cache entries:`, keysToRemove);
      
      // Also clear specific known cache keys
      localStorage.removeItem('uploadedImages');
      localStorage.removeItem('fetchedImages');
      localStorage.removeItem('productImages');
      localStorage.removeItem('imageCache');
    } catch (error) {
      console.warn('Could not clear localStorage:', error);
    }
    
    // Clear browser cache for images (force reload)
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('image') || name.includes('cache')) {
            caches.delete(name);
            console.log(`✅ Cleared service worker cache: ${name}`);
          }
        });
      });
    }

    const loadShopDetails = async () => {
      try {
        const details = await shopDetailsService.getShopDetails();
        console.log('Loaded shop details:', details);

        // Ensure address is properly structured
        if (details && details.address && typeof details.address === 'object') {
          setShopDetails(details);
        } else if (details) {
          // If address is a string, convert it to object structure
          const addressString = details.address || '';
          setShopDetails({
            ...details,
            address: typeof addressString === 'string' ? {
              street: addressString,
              city: '',
              state: '',
              pincode: ''
            } : {
              street: '',
              city: '',
              state: '',
              pincode: ''
            }
          });
        } else {
          // Set default shop details if none found
          setShopDetails({
            name: 'KrishiSethu Fertilizers',
            address: {
              street: '123 Agricultural Complex',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001'
            },
            phone: '+91-9876543210',
            gstNumber: '27AAAAA0000A1Z5',
            logo: '/Logo.png'
          });
        }
      } catch (error) {
        console.error('Failed to load shop details:', error);
        // Set default shop details on error
        setShopDetails({
          name: 'KrishiSethu Fertilizers',
          address: {
            street: '123 Agricultural Complex',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          },
          phone: '+91-9876543210',
          gstNumber: '27AAAAA0000A1Z5',
          logo: '/Logo.png'
        });
      }
    };

    const loadProducts = async () => {
      try {
        // Use real Supabase data
        const supabaseProducts = await productsService.getAll();
        console.log('🔍 Raw products from database:', supabaseProducts);

        const posProducts = supabaseProducts.map(product => {
          // Handle category - resolve category name from loaded categories
          let categoryName = product.categoryName || product.category || 'Unknown';

          console.log(`🔍 Processing product: ${product.name}`);
          console.log(`📋 Product category fields:`, {
            category_id: product.category_id,
            categoryId: product.categoryId,
            category: product.category,
            categoryName: product.categoryName
          });
          console.log(`📋 Available categories:`, categories.map(cat => `${cat.name} (ID: ${cat.id})`));

          // If we have category_id, try to resolve it using loaded categories
          if (product.category_id && categories.length > 0) {
            const foundCategory = categories.find(cat => cat.id === product.category_id);
            if (foundCategory) {
              categoryName = foundCategory.name;
              console.log(`✅ Resolved category_id ${product.category_id} -> ${categoryName}`);
            } else {
              console.log(`❌ Could not find category with ID: ${product.category_id}`);
            }
          }

          // Fallback for categoryId field (legacy support)
          if ((!categoryName || categoryName === 'Unknown') && product.categoryId && categories.length > 0) {
            const foundCategory = categories.find(cat => cat.id === product.categoryId);
            if (foundCategory) {
              categoryName = foundCategory.name;
              console.log(`✅ Resolved categoryId ${product.categoryId} -> ${categoryName}`);
            } else {
              console.log(`❌ Could not find category with ID: ${product.categoryId}`);
            }
          }

          // If still no category name, try to map from old category names to new ones
          if (!categoryName || categoryName === 'Unknown') {
            const oldToNewCategoryMapping = {
              'NPK Fertilizers': 'Chemical Fertilizer',
              'Nitrogen Fertilizers': 'Chemical Fertilizer',
              'Phosphorus Fertilizers': 'Chemical Fertilizer',
              'Organic Fertilizers': 'Organic Fertilizer',
              'Micronutrients': 'Chemical Fertilizer',
              'Bio Fertilizers': 'Bio Fertilizer'
            };

            // Check if product has an old category name that needs mapping
            const productCategoryField = product.category || product.categoryName || '';
            if (oldToNewCategoryMapping[productCategoryField]) {
              categoryName = oldToNewCategoryMapping[productCategoryField];
              console.log(`🔄 Mapped old category "${productCategoryField}" -> "${categoryName}"`);
            }
          }

          // Handle image URLs - get first image from array or single image field
          let imageUrl = null;
          if (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
            imageUrl = product.imageUrls[0];
          } else if (product.image) {
            imageUrl = product.image;
          }

          const mappedProduct = {
            id: product.id,
            name: product.name,
            brand: product.brandName || product.brand || 'Unknown Brand',
            price: product.salePrice,
            mrp: product.mrp || product.salePrice,
            stock: product.quantity,
            category: categoryName, // Use resolved category name
            batchNo: product.batchNo || '',
            hsn: product.hsn || product.hsnCode || '',
            gstRate: product.gstRate ?? null,
            unit: product.unit || 'PCS',
            manufacturingDate: product.manufacturingDate || product.mfgDate || null,
            expiryDate: product.expiryDate || null,
            barcode: product.barcode || '',
            image: imageUrl // Use resolved image URL
          };

          console.log(`📦 Final mapped product: ${product.name} -> Category: ${categoryName}, Image: ${imageUrl}`);
          console.log(`📊 Product mapping result:`, {
            name: product.name,
            originalCategory: product.category || product.categoryName,
            resolvedCategory: categoryName,
            category_id: product.category_id,
            categoryId: product.categoryId
          });

          return mappedProduct;
        });
        
        // Log category distribution for debugging
        const categoryDistribution = {};
        posProducts.forEach(product => {
          const category = product.category || 'Unknown';
          categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
        });

        console.log('📊 POS Category Distribution:', categoryDistribution);
        console.log('📋 Expected Categories:', categories.map(cat => cat.name));
        console.log('✅ POS Products loaded and mapped:', posProducts.length);

        // Set products first, then load images asynchronously
        setProducts(posProducts);

        // AUTOMATIC IMAGE LOADING DISABLED - Use manual upload only
        console.log('📁 Automatic image loading disabled. Products loaded without images.');

        // Handle empty product database
        if (supabaseProducts.length === 0) {
          console.log('📦 No products found in database');
          setProducts([]);

          // Show notification to add products
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-blue-500 text-white p-3 rounded-lg shadow-lg z-50';
          notification.innerHTML = `
            <div class="flex items-center gap-2">
              <span>📦</span>
              <div>
                <div class="font-medium">No Products Found</div>
                <div class="text-sm">Add products in the Inventory section to start selling</div>
              </div>
            </div>
          `;
          document.body.appendChild(notification);

          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 8000);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);

        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50';
        notification.innerHTML = `
          <div class="flex items-center gap-2">
            <span>❌</span>
            <div>
              <div class="font-medium">Failed to Load Products</div>
              <div class="text-sm">Check your internet connection and try refreshing</div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 8000);
      }
    };

    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        console.log('🔄 Loading categories for POS...');

        // Load categories from database
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          console.log('✅ Setting POS categories:', data);
          console.log('📋 POS Categories loaded:', data.map(cat => `${cat.name} (ID: ${cat.id})`));
          setCategories(data);
        } else {
          console.log('📦 No categories found in database, using config fallback');
          // Use the same config categories as AddProduct
          const configCategories = [
            { id: 'cat_1', name: 'Chemical Fertilizer', description: 'Chemical fertilizers and nutrients', is_active: true, sort_order: 1 },
            { id: 'cat_2', name: 'Organic Fertilizer', description: 'Organic fertilizers and manures', is_active: true, sort_order: 2 },
            { id: 'cat_3', name: 'Bio Fertilizer', description: 'Bio fertilizers and microbial products', is_active: true, sort_order: 3 },
            { id: 'cat_4', name: 'Seeds', description: 'Seeds and planting materials', is_active: true, sort_order: 4 },
            { id: 'cat_5', name: 'Pesticides', description: 'Pesticides and plant protection products', is_active: true, sort_order: 5 },
            { id: 'cat_6', name: 'Tools & Equipment', description: 'Agricultural tools and equipment', is_active: true, sort_order: 6 }
          ];
          setCategories(configCategories);
        }
      } catch (error) {
        console.error('❌ Error loading POS categories:', error);
        // Use the same config categories as AddProduct
        const configCategories = [
          { id: 'cat_1', name: 'Chemical Fertilizer', description: 'Chemical fertilizers and nutrients', is_active: true, sort_order: 1 },
          { id: 'cat_2', name: 'Organic Fertilizer', description: 'Organic fertilizers and manures', is_active: true, sort_order: 2 },
          { id: 'cat_3', name: 'Bio Fertilizer', description: 'Bio fertilizers and microbial products', is_active: true, sort_order: 3 },
          { id: 'cat_4', name: 'Seeds', description: 'Seeds and planting materials', is_active: true, sort_order: 4 },
          { id: 'cat_5', name: 'Pesticides', description: 'Pesticides and plant protection products', is_active: true, sort_order: 5 },
          { id: 'cat_6', name: 'Tools & Equipment', description: 'Agricultural tools and equipment', is_active: true, sort_order: 6 }
        ];
        setCategories(configCategories);
      } finally {
        setCategoriesLoading(false);
      }
    };

    // Load categories first, then products (so we can resolve category names)
    const initializePOS = async () => {
      await loadCategories();
      await loadProducts();
    };

    initializePOS();
    loadCustomers();
    loadShopDetails();
  }, []);

  // Load customers from Firebase
  const loadCustomers = async () => {
    try {
      const firebaseCustomers = await customersService.getAll();
      setCustomers(firebaseCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);

      // Show warning notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-yellow-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <span>⚠️</span>
          <div>
            <div class="font-medium">Failed to Load Customers</div>
            <div class="text-sm">You can still make sales to walk-in customers</div>
          </div>
        </div>
      `;
      document.body.appendChild(notification);

      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 6000);
    }
  };

  // Filter products based on search term and category
  useEffect(() => {
    console.log('🔄 POS Filtering - Selected Category:', selectedCategory);
    console.log('📦 POS Filtering - Total Products:', products.length);
    console.log('📋 Available Categories:', categories.map(cat => cat.name));

    let filtered = products;

    // Filter by category first
    if (selectedCategory !== 'All Items') {
      console.log('🔍 POS Filtering by category:', selectedCategory);

      filtered = filtered.filter(product => {
        const productCategory = (product.category || '').toLowerCase().trim();
        const selectedCat = selectedCategory.toLowerCase().trim();

        console.log(`🔍 Checking product "${product.name}" with category "${product.category}" against "${selectedCategory}"`);

        // Exact match first (most reliable)
        if (productCategory === selectedCat) {
          console.log(`✅ Exact match: "${productCategory}" === "${selectedCat}"`);
          return true;
        }

        // Handle common variations and partial matches
        const categoryVariations = {
          'chemical fertilizer': ['chemical', 'fertilizer', 'npk', 'urea', 'dap'],
          'organic fertilizer': ['organic', 'compost', 'manure', 'vermi'],
          'bio fertilizer': ['bio', 'biological', 'microbial', 'rhizobium'],
          'seeds': ['seed', 'grain', 'crop'],
          'pesticides': ['pesticide', 'insecticide', 'fungicide', 'herbicide'],
          'tools & equipment': ['tool', 'equipment', 'sprayer', 'implement']
        };

        // Check if product category matches any variation of selected category
        const variations = categoryVariations[selectedCat] || [selectedCat];
        const matchesVariation = variations.some(variation =>
          productCategory.includes(variation) || variation.includes(productCategory)
        );

        if (matchesVariation) {
          console.log(`✅ Variation match: "${productCategory}" matches variation of "${selectedCat}"`);
          return true;
        }

        // Fallback: partial match
        const includesMatch = productCategory.includes(selectedCat) || selectedCat.includes(productCategory);
        if (includesMatch) {
          console.log(`✅ Partial match: "${productCategory}" includes "${selectedCat}"`);
        }
        return includesMatch;
      });

      console.log(`📊 POS Filtered to ${filtered.length} products for category "${selectedCategory}"`);
    }

    // Then filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.hsn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    console.log(`📊 POS Final filtered products: ${filtered.length}`);
    console.log('📋 Filtered products:', filtered.map(p => `${p.name} (${p.category})`));
    setFilteredProducts(filtered);
  }, [searchTerm, products, selectedCategory, categories]);

  // Add product to cart
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setSearchTerm(''); // Clear search after adding
  };

  // Update quantity in cart
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(cart.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Number to words function
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

    if (num === 0) return 'Zero';

    const convertHundreds = (n) => {
      let result = '';
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result;
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result;
    };

    let result = '';
    let thousandIndex = 0;

    while (num > 0) {
      if (num % 1000 !== 0) {
        result = convertHundreds(num % 1000) + thousands[thousandIndex] + ' ' + result;
      }
      num = Math.floor(num / 1000);
      thousandIndex++;
    }

    return result.trim();
  };

  // Enhanced calculation functions with item-wise GST and custom GST rate
  const calculateCartTotals = () => {
    let subtotalBeforeDiscount = 0;
    let totalGSTAmount = 0;
    
    const itemsWithGST = cart.map(item => {
      const itemSubtotal = (item.price || 0) * item.quantity;
      
      // Get GST rate for this item - custom rate takes priority
      let gstRate = customGSTRate !== null ? customGSTRate : item.gstRate;
      if (!gstRate && gstRate !== 0) {
        // Use GST service to determine rate based on category
        if (item.category) {
          gstRate = gstService.getGSTRate(item.category);
        } else {
          gstRate = 5; // Default fallback for fertilizers
        }
      }
      
      // Calculate GST amount for this item
      const gstAmount = (itemSubtotal * gstRate) / 100;
      
      subtotalBeforeDiscount += itemSubtotal;
      totalGSTAmount += gstAmount;
      
      return { ...item, gstRate, gstAmount, itemSubtotal };
    });
    
    return {
      subtotal: subtotalBeforeDiscount,
      itemsWithGST,
      totalGSTAmount
    };
  };

  const calculateDiscount = () => {
    if (discountType === 'percentage') {
      return (cartTotals.subtotal * discount) / 100;
    } else {
      return Math.min(discount, cartTotals.subtotal); // Amount discount can't exceed subtotal
    }
  };

  // Calculate totals
  const cartTotals = calculateCartTotals();
  const subtotal = cartTotals.subtotal;
  const discountAmount = calculateDiscount();
  const taxableAmount = subtotal - discountAmount;
  
  // Apply discount proportionally to GST amount
  const discountRatio = taxableAmount / subtotal;
  const taxAmount = cartTotals.totalGSTAmount * discountRatio;
  const total = taxableAmount + taxAmount;
  
  // Calculate average GST rate for display
  const averageGSTRate = customGSTRate !== null ? customGSTRate : (subtotal > 0 ? (cartTotals.totalGSTAmount / subtotal) * 100 : 5);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Handle barcode scan
  const handleBarcodeScan = async (barcode) => {
    try {
      console.log('[POS] Processing barcode:', barcode);

      const result = await barcodeService.findProductByBarcode(barcode, products);

      if (result.success) {
        addToCart(result.product);

        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
        notification.textContent = `✓ Added: ${result.product.name}`;
        document.body.appendChild(notification);

        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);

        setShowBarcodeScanner(false);
      } else {
        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50';
        notification.textContent = `❌ Product not found: ${barcode}`;
        document.body.appendChild(notification);

        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      }
    } catch (error) {
      console.error('Error handling barcode scan:', error);

      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = '❌ Error processing barcode';
      document.body.appendChild(notification);

      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  };

  // Handle manual image upload
  const handleImageUpload = async (file, product) => {
    try {
      setUploadingImage(true);
      console.log(`📁 Uploading image for: ${product.name}`);

      const result = await imageService.uploadImage(file, product.id);

      if (result.success) {
        // Update the product in the products list
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === product.id
              ? { ...p, image: result.imageUrl, imageSource: 'manual' }
              : p
          )
        );

        // Update filtered products as well
        setFilteredProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === product.id
              ? { ...p, image: result.imageUrl, imageSource: 'manual' }
              : p
          )
        );

        alert(`✅ Image uploaded successfully for ${product.name}`);
        setShowImageUploadDialog(false);
        setSelectedProductForUpload(null);
      } else {
        alert(`❌ Failed to upload image: ${result.error}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('❌ Error uploading image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    console.log('🔄 POS Category selected:', category);
    console.log('📊 Available categories:', categories.map(c => c.name));
    console.log('📦 Total products:', products.length);
    setSelectedCategory(category);
    // Products will be filtered automatically by the useEffect above
  };


  // Enhanced sale completion with offline support
  const completeSale = async () => {
    console.log('completeSale function called');

    // Validation
    if (cart.length === 0) {
      alert('Please add items to cart before completing sale');
      return;
    }

    if (total <= 0) {
      alert('Invalid sale total');
      return;
    }

    console.log('Starting payment processing...');
    setIsProcessing(true);

    try {
      // Prepare sale data in database format
      const customerName = selectedCustomer?.name || customerForm.name || 'Walk-in Customer';

      // Transform data to match exact Supabase database schema
      const saleData = {
        // Required fields only - let database handle defaults
        sale_number: currentBillNumber,
        customer_name: customerName,

        // Financial fields with proper decimal formatting
        // Financial fields with proper decimal formatting (after migration)
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(discountAmount.toFixed(2)),
        tax_amount: Number(taxAmount.toFixed(2)),
        total_amount: Number(total.toFixed(2)),

        // Payment fields
        payment_method: paymentData.method || 'cash',
        amount_paid: Number(total.toFixed(2)),
        payment_status: 'completed',

        // Optional fields
        customer_id: selectedCustomer?.id || null,
        status: 'completed',
        notes: notes || '',
        sale_date: new Date().toISOString().split('T')[0],
        // Skip created_by for now - it's optional and references users table

        // Items for sale_items table
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: Number(item.quantity),
          unit_price: Number(item.price.toFixed(2)),
          total_price: Number((item.price * item.quantity).toFixed(2)),
          gst_rate: Number((item.gstRate || 5).toFixed(2)),
          batch_no: item.batchNo || null
        }))
      };

      console.log('🔄 Transformed sale data for database:', saleData);
      console.log('💰 Amount details:', {
        subtotal: subtotal,
        discountAmount: discountAmount,
        taxAmount: taxAmount,
        total: total,
        'saleData.total_amount': saleData.total_amount
      });

      // Validate required fields
      if (!saleData.sale_number) {
        throw new Error('Sale number is required');
      }
      if (!saleData.customer_name) {
        throw new Error('Customer name is required');
      }
      if (!saleData.total_amount || saleData.total_amount <= 0) {
        throw new Error('Valid total amount is required');
      }

      // Try to save to Supabase database first
      let savedToDatabase = false;
      let savedSale = null;
      try {
        if (navigator.onLine) {
          console.log('💾 Attempting to save sale to Supabase database...');
          savedSale = await salesService.create(saleData);
          savedToDatabase = true;
          console.log('✅ Sale saved to Supabase successfully:', savedSale);
          console.log('💰 Saved sale amount details:', {
            'savedSale.total_amount': savedSale.total_amount,
            'savedSale.subtotal': savedSale.subtotal,
            'savedSale.tax_amount': savedSale.tax_amount
          });
        }
      } catch (databaseError) {
        console.error('❌ Failed to save to Supabase:', databaseError);
        console.error('❌ Error details:', {
          message: databaseError.message,
          code: databaseError.code,
          details: databaseError.details,
          hint: databaseError.hint
        });
        console.error('❌ Sale data that failed:', saleData);
        console.warn('Will store offline instead');
      }

      // If Supabase failed or offline, store in IndexedDB
      if (!savedToDatabase) {
        try {
          // Add a temporary ID for offline storage
          const offlineSaleData = {
            ...saleData,
            id: `offline_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            synced: false
          };

          await offlineStorage.addOfflineSale(offlineSaleData);
          console.log('📱 Sale stored offline successfully - will sync to Supabase when online');

          // Show offline notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-yellow-500 text-white p-3 rounded-lg shadow-lg z-50';
          notification.textContent = '📱 Sale saved offline - will sync to Supabase when online';
          document.body.appendChild(notification);

          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 5000);
        } catch (offlineError) {
          console.error('❌ Failed to store sale offline:', offlineError);
          throw new Error('Failed to save sale both to Supabase and offline');
        }
      }

      // Update inventory quantities
      const updatedProductIds = [];
      for (const item of cart) {
        try {
          const product = products.find(p => p.id === item.id);
          if (product) {
            // Use the current stock value from POS display (product.stock) instead of product.quantity
            const currentStock = product.stock || product.quantity || 0;
            const newQuantity = Math.max(0, currentStock - item.quantity);

            console.log(`📦 Updating stock for ${product.name}:`, {
              currentStock,
              soldQuantity: item.quantity,
              newQuantity,
              productId: product.id
            });

            if (navigator.onLine) {
              await productsService.update(product.id, { quantity: newQuantity });
              console.log(`✅ Database updated for ${product.name}: ${currentStock} → ${newQuantity}`);
              updatedProductIds.push(product.id);
            } else {
              // Store inventory update offline
              await offlineStorage.addOfflineInventoryUpdate({
                id: `inv_update_${Date.now()}_${item.id}`,
                productId: item.id,
                type: 'sale',
                quantityChange: -item.quantity,
                newQuantity,
                saleId: savedSale?.id || saleData.id,
                timestamp: new Date()
              });
            }

            // Update local products state immediately to reflect new stock
            setProducts(prevProducts => 
              prevProducts.map(p => 
                p.id === product.id 
                  ? { ...p, stock: newQuantity, quantity: newQuantity }
                  : p
              )
            );
          }
        } catch (inventoryError) {
          console.warn('Failed to update inventory for product:', item.id, inventoryError);
        }
      }

      // Also update filteredProducts to ensure display is consistent
      setFilteredProducts(prevFiltered => 
        prevFiltered.map(product => {
          if (updatedProductIds.includes(product.id)) {
            const cartItem = cart.find(item => item.id === product.id);
            if (cartItem) {
              const currentStock = product.stock || product.quantity || 0;
              const newQuantity = Math.max(0, currentStock - cartItem.quantity);
              return { ...product, stock: newQuantity, quantity: newQuantity };
            }
          }
          return product;
        })
      );

      console.log(`📊 Updated stock for ${updatedProductIds.length} products in local state`);

      // Close payment dialog and show receipt
      setShowPaymentDialog(false);
      setShowReceiptDialog(true);

      console.log('Payment completed successfully!');

      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = '✅ Sale completed successfully!';
      document.body.appendChild(notification);

      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);

      // Send push notification for sale completion
      try {
        if (notificationService.isTypeEnabled('sales')) {
          notificationService.showSalesNotification({
            id: savedSale?.id || saleData.sale_number,
            total: total,
            customerName: customerName,
            itemCount: cart.length,
            timestamp: new Date()
          });
        }
      } catch (notificationError) {
        console.warn('Failed to send sales notification:', notificationError);
      }

    } catch (error) {
      console.error('Error in payment:', error);
      console.error('❌ Payment Error Details:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'NO_CODE',
        details: error?.details || 'No details',
        hint: error?.hint || 'No hint',
        stack: error?.stack || 'No stack trace',
        fullError: error
      });
      
      // Create user-friendly error message
      const userMessage = error?.message || error?.toString() || 'Unknown error occurred';
      alert(`Payment failed: ${userMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear cart function
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setDiscountReason('');
    setNotes('');
  };

  // Barcode scanning functions
  const handleBarcodeSearch = () => {
    if (!barcodeInput.trim()) return;

    const product = products.find(p =>
      p.barcode === barcodeInput ||
      p.id === barcodeInput ||
      p.name.toLowerCase().includes(barcodeInput.toLowerCase())
    );

    if (product) {
      addToCart(product);
      setBarcodeInput('');
      setShowBarcodeDialog(false);
    } else {
      alert('Product not found with this barcode/ID');
    }
  };

  const openBarcodeScanner = () => {
    setShowBarcodeScanner(true);
  };

  const closeBarcodeScanner = () => {
    setShowBarcodeScanner(false);
  };

  // Enhanced discount management
  const applyDiscount = () => {
    if (discount > 0 && discountReason.trim()) {
      setShowDiscountDialog(false);
    } else {
      alert('Please enter discount amount and reason');
    }
  };

  const removeDiscount = () => {
    setDiscount(0);
    setDiscountReason('');
  };

  // Customer selection functions
  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSelectDialog(false);
  };

  const removeCustomer = () => {
    setSelectedCustomer(null);
  };

  // Print receipt function - Optimized Dual Copy Layout for A4 Portrait
  const printReceipt = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=794,height=1123');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>GST Invoice - ${currentBillNumber}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: Arial, sans-serif;
                font-size: 10px;
                line-height: 1.2;
                color: #000;
                background: white;
                padding: 8mm;
              }
              
              .dual-invoice-container {
                width: 210mm;
                height: 297mm;
                margin: 0 auto;
                background: white;
                display: grid;
                grid-template-rows: 1fr 1fr;
                gap: 3mm;
                padding: 5mm;
                box-sizing: border-box;
                page-break-inside: avoid;
              }
              
              .invoice-copy {
                border: 2px solid #000;
                padding: 3mm;
                background: white;
                width: 200mm;
                height: 140mm;
                box-sizing: border-box;
                display: grid;
                grid-template-rows: auto auto 1fr auto;
                gap: 2mm;
                overflow: hidden;
                position: relative;
              }
              
              .header-section {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                border-bottom: 2px solid #000;
                padding-bottom: 3mm;
                grid-row: 1;
              }
              
              .company-logo {
                width: 50px;
                height: 40px;
                border: 1px solid #000;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                font-size: 8px;
              }
              
              .company-logo img {
                max-width: 48px;
                max-height: 38px;
                object-fit: contain;
              }
              
              .company-info {
                flex: 1;
                text-align: center;
                padding: 0 8px;
              }
              
              .company-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 2px;
              }
              
              .gst-invoice {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 3px;
              }
              
              .company-details {
                font-size: 9px;
                line-height: 1.3;
              }
              
              .right-logo {
                width: 50px;
                height: 40px;
                border: 1px solid #000;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                font-size: 8px;
              }
              
              .copy-type {
                font-size: 12px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 4px;
                text-decoration: underline;
                padding: 2px 0;
              }
              
              .customer-invoice-section {
                display: flex;
                justify-content: space-between;
                gap: 3mm;
                font-size: 8px;
                grid-row: 2;
              }
              
              .customer-details, .invoice-details {
                flex: 1;
                border: 1px solid #000;
                padding: 4px;
              }
              
              .section-title {
                font-weight: bold;
                font-size: 10px;
                margin-bottom: 2px;
              }
              
              .customer-name {
                font-size: 11px;
                font-weight: bold;
                margin: 2px 0;
              }
              
              .items-table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #000;
                font-size: 6px;
                table-layout: fixed;
                grid-row: 3;
                align-self: start;
              }
              
              .items-table th,
              .items-table td {
                border: 1px solid #000;
                padding: 1px;
                text-align: center;
                vertical-align: middle;
                line-height: 1.0;
                word-wrap: break-word;
                overflow: hidden;
                font-size: 5px;
              }
              
              .items-table th {
                background-color: #f5f5f5;
                font-weight: bold;
                font-size: 5px;
                padding: 2px 1px;
                text-align: center;
              }
              
              .product-name {
                text-align: left !important;
                font-weight: bold;
              }
              
              .amount-col {
                text-align: right !important;
                font-weight: bold;
              }
              
              .total-row {
                background-color: #f9f9f9;
                font-weight: bold;
                font-size: 9px;
              }
              
              
              .total-amount-section {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin: 4px 0;
                gap: 8px;
              }
              
              .amount-words {
                font-size: 9px;
                font-style: italic;
                flex: 1;
                padding: 2px;
              }
              
              .total-amount-display {
                text-align: right;
                flex-shrink: 0;
              }
              
              .total-amount-display .grand-total-display {
                font-size: 16px;
                font-weight: bold;
                margin: 0 0 2px 0;
                padding: 3px 6px;
                border: 1px solid #000;
                background-color: #f0f0f0;
                text-align: center;
                min-width: 100px;
              }
              
              .total-amount-label {
                font-size: 8px;
                text-align: center;
                font-weight: bold;
                margin-top: 2px;
              }
              
              .footer-content {
                grid-row: 4;
                display: grid;
                grid-template-rows: auto auto auto auto;
                gap: 1mm;
                font-size: 6px;
              }
              
              .total-amount-words {
                font-weight: bold;
                text-align: center;
                grid-row: 1;
              }
              
              .total-amount-display {
                text-align: center;
                grid-row: 2;
              }
              
              .footer-section {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                font-size: 6px;
                gap: 5mm;
                grid-row: 3;
              }
              
              .terms-section {
                flex: 1;
              }
              
              .payment-section {
                flex: 1;
                text-align: right;
              }
              
              .signature-section {
                display: flex;
                justify-content: space-between;
                font-size: 6px;
                gap: 5mm;
                grid-row: 4;
              }
              
              .company-signature {
                flex: 1;
              }
              
              .customer-signature {
                flex: 1;
                text-align: right;
              }
              
              .signature-line {
                border-top: 1px solid #000;
                margin-top: 8px;
                padding-top: 1px;
                height: 8px;
                font-size: 6px;
              }
              
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 8mm;
                }
                
                body {
                  font-size: 9px;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  padding: 0;
                  margin: 0;
                }
                
                .dual-invoice-container {
                  width: 210mm !important;
                  height: 297mm !important;
                  display: grid !important;
                  grid-template-rows: 1fr 1fr !important;
                  gap: 3mm !important;
                  padding: 5mm !important;
                  margin: 0 auto !important;
                  page-break-inside: avoid !important;
                }
                
                .invoice-copy {
                  border: 2px solid #000 !important;
                  width: 200mm !important;
                  height: 140mm !important;
                  max-height: 140mm !important;
                  min-height: 140mm !important;
                  padding: 3mm !important;
                  box-sizing: border-box !important;
                  display: grid !important;
                  grid-template-rows: auto auto 1fr auto !important;
                  gap: 2mm !important;
                  overflow: hidden !important;
                  page-break-inside: avoid !important;
                }
                
                .items-table th,
                .items-table td {
                  border: 1px solid #000 !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  font-size: 7px !important;
                }
                
                .items-table th {
                  font-size: 6px !important;
                }
                
                .total-row {
                  font-size: 8px !important;
                }
                
                .total-amount-display .grand-total-display {
                  font-size: 14px !important;
                }
                
                .company-name {
                  font-size: 16px !important;
                }
                
                .gst-invoice {
                  font-size: 12px !important;
                }
                
                .copy-type {
                  font-size: 11px !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="dual-invoice-container">
                <!-- CUSTOMER COPY -->
              <div class="invoice-copy">
                <!-- Copy Type -->
                <div class="copy-type">Customer Copy</div>
                
                <!-- Header Section - JaiKisan Style -->
                <div class="header-section">
                  <div class="company-logo">
                    ${shopDetails?.logo ? `
                      <img src="${shopDetails.logo}" alt="Logo" />
                    ` : `
                      <div style="font-size: 8px; font-weight: bold; text-align: center;">JAI<br/>KISAN</div>
                    `}
                  </div>
                  
                  <div class="company-info">
                    <div class="company-name">${shopDetails?.name || 'KrishiSethu'}</div>
                    <div class="gst-invoice">GST Invoice</div>
                  </div>
                  
                  <div class="right-logo">
                    <div id="qrcode-customer" style="width: 48px; height: 38px; display: flex; align-items: center; justify-content: center;"></div>
                  </div>
                </div>
                
                <!-- Clean Company & Invoice Information Section -->
                <div class="customer-invoice-section">
                  <!-- Left Side - Company Info -->
                  <div class="customer-details">
                    <div class="font-semibold">${shopDetails?.name || 'Test company'} Limited</div>
                    <div class="mt-1">
                      <div><strong>DispatchedFrom</strong></div>
                      <div>${shopDetails?.address ? formatAddress(shopDetails.address) : 'Fertilizer Distribution Center, Hyderabad, Telangana, 500001'}</div>
                      <div>Telangana, India</div>
                      <div><strong>GSTIN:</strong> ${shopDetails?.gstNumber || '36AAACZ3924H1Z5'}</div>
                      <div><strong>MFDSID:</strong> ${shopDetails?.mfdSid || '1115736'}</div>
                    </div>
                    <div class="mt-1">
                      <div class="inline-block border border-black px-1"><strong>StateName:</strong> Telangana</div>
                    </div>
                  </div>
                  
                  <!-- Right Side - Invoice & Customer Info -->
                  <div class="invoice-details">
                    <div><strong>InvoiceNo.:</strong> ${currentBillNumber}</div>
                    <div><strong>ReceiptNo.:</strong> ${currentBillNumber}</div>
                    <div><strong>InvoiceDate:</strong> ${new Date().toLocaleDateString('en-GB')}</div>
                    <div><strong>LicenseNo.:</strong> ${shopDetails?.licenseNumber || 'NGKL/20/ADA/FR/2019/23125'}</div>
                    
                    <div class="mt-2">
                      <div><strong>BilledCustomer(Billto)</strong></div>
                      <div><strong>CustomerNo.:</strong> ${selectedCustomer?.id || 'S35100000371'}</div>
                      <div><strong>CustomerName:</strong> ${selectedCustomer?.name || customerForm.name || 'Walk-in Customer'}</div>
                      <div><strong>Village:</strong> ${selectedCustomer?.city || customerForm.city || 'N/A'}</div>
                      <div><strong>PhoneNo.:</strong> ${selectedCustomer?.phone || customerForm.phone || 'N/A'}</div>
                      <div><strong>SalesType:</strong> Cash Sales</div>
                      <div><strong>CustomerGSTNo:</strong> ${selectedCustomer?.gstNumber || customerForm.gstNumber || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                
                <!-- Items Table -->
                <table class="items-table">
                  <thead>
                    <tr>
                      <th style="width: 5%;">S.No</th>
                      <th style="width: 30%;">Description of Goods</th>
                      <th style="width: 8%;">Item Code</th>
                      <th style="width: 8%;">HSN/SAC</th>
                      <th style="width: 8%;">Batch No.</th>
                      <th style="width: 8%;">Expiry</th>
                      <th style="width: 10%;">Qty & Unit</th>
                      <th style="width: 6%;">Pack</th>
                      <th style="width: 8%;">Rate</th>
                      <th style="width: 10%;">Amount</th>
                      <th style="width: 8%;">Discount</th>
                      <th style="width: 10%;">Taxable</th>
                      <th style="width: 4%;">CGST%</th>
                      <th style="width: 8%;">CGST</th>
                      <th style="width: 4%;">SGST%</th>
                      <th style="width: 8%;">SGST</th>
                      <th style="width: 4%;">IGST%</th>
                      <th style="width: 8%;">IGST</th>
                      <th style="width: 10%;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${cart.map((item, index) => {
                      const itemTotal = item.price * item.quantity;
                      const gstRate = item.gstRate || 5;
                      const taxableAmount = itemTotal;
                      const gstAmount = (itemTotal * gstRate) / 100;
                      const cgstAmount = gstAmount / 2;
                      const sgstAmount = gstAmount / 2;
                      const totalWithTax = itemTotal + gstAmount;
                      
                      return `
                        <tr>
                          <td>${index + 1}</td>
                          <td class="product-name">${item.name}</td>
                          <td>${item.barcode || 'N/A'}</td>
                          <td>${item.hsn || '31051000'}</td>
                          <td>N/A</td>
                          <td>N/A</td>
                          <td>${item.quantity} ${item.unit || 'bags'}</td>
                          <td>${item.unit || 'BAG'}</td>
                          <td>₹${item.price.toFixed(2)}</td>
                          <td class="amount-col">₹${itemTotal.toFixed(2)}</td>
                          <td>₹0.00</td>
                          <td class="amount-col">₹${taxableAmount.toFixed(2)}</td>
                          <td>${(gstRate/2).toFixed(1)}</td>
                          <td>₹${cgstAmount.toFixed(2)}</td>
                          <td>${(gstRate/2).toFixed(1)}</td>
                          <td>₹${sgstAmount.toFixed(2)}</td>
                          <td>0.0</td>
                          <td>₹0.00</td>
                          <td class="amount-col">₹${totalWithTax.toFixed(2)}</td>
                        </tr>
                      `;
                    }).join('')}
                    
                    <!-- Grand Total Row -->
                    <tr class="total-row">
                      <td colspan="9"><strong>Grand Total</strong></td>
                      <td class="amount-col"><strong>₹${subtotal.toFixed(2)}</strong></td>
                      <td><strong>₹${discountAmount.toFixed(2)}</strong></td>
                      <td class="amount-col"><strong>₹${(subtotal - discountAmount).toFixed(2)}</strong></td>
                      <td></td>
                      <td><strong>₹${(taxAmount/2).toFixed(2)}</strong></td>
                      <td></td>
                      <td><strong>₹${(taxAmount/2).toFixed(2)}</strong></td>
                      <td></td>
                      <td><strong>₹0.00</strong></td>
                      <td class="amount-col"><strong>₹${total.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
                
                <!-- Footer Content -->
                <div class="footer-content">
                  <!-- Total Amount in Words -->
                  <div class="total-amount-words">
                    <strong>Total Invoice Value (in words):</strong> ${numberToWordsIndian(Math.round(total))} Only
                  </div>
                  
                  <!-- Total Amount Display -->
                  <div class="total-amount-display">
                    <div style="border: 2px solid #000; padding: 3px 6px; text-align: center; font-weight: bold; font-size: 12px; display: inline-block; min-width: 80px;">
                      ₹${total.toFixed(2)}
                    </div>
                    <div style="font-size: 6px; text-align: center; margin-top: 1px;">Total Amount (incl. tax)</div>
                  </div>
                  
                  <!-- Footer Section -->
                  <div class="footer-section">
                    <div class="terms-section">
                      <strong>Terms & Conditions:</strong> Goods once sold will not be taken back<br>
                      This invoice is not payable under reverse charge
                    </div>
                    <div class="payment-section">
                      <strong>Payment Method:</strong> ${paymentData.method?.toUpperCase() || 'CASH'}<br>
                      <strong>Amount Received:</strong> ₹${paymentData.amountReceived?.toFixed(2) || total.toFixed(2)}<br>
                      <strong>Change:</strong> ₹${Math.max(0, (paymentData.amountReceived || total) - total).toFixed(2)}
                    </div>
                  </div>
                  
                  <!-- Signatures Section -->
                  <div class="signature-section">
                    <div class="company-signature">
                      <strong>For ${shopDetails?.name || 'Test company'}</strong>
                      <div class="signature-line">Authorized Signatory</div>
                    </div>
                    <div class="customer-signature">
                      <strong>Customer Signature</strong><br>
                      <strong>For Acknowledgement</strong>
                      <div class="signature-line">Customer</div>
                    </div>
                  </div>
                </div>
                
                <!-- Footer Note -->
                <div style="text-align: center; font-size: 5px; margin-top: 1px; padding-top: 1px; border-top: 1px solid #ccc; position: absolute; bottom: 0; left: 0; right: 0;">
                  Note: Unless otherwise stated, tax on this invoice is not payable under reverse charge
                </div>
              </div>
              
              <!-- OFFICE/AUDIT COPY -->
              <div class="invoice-copy">
                <!-- Copy Type -->
                <div class="copy-type">Office Copy</div>
                
                <!-- Header Section - JaiKisan Style -->
                <div class="header-section">
                  <div class="company-logo">
                    ${shopDetails?.logo ? `
                      <img src="${shopDetails.logo}" alt="Logo" />
                    ` : (
                      '<div class="text-xs font-bold text-center">JAI<br/>KISAN</div>'
                    )}
                  </div>
                  
                  <div class="company-info">
                    <div class="company-name">${shopDetails?.name || 'KrishiSethu'}</div>
                    <div class="gst-invoice">GST Invoice</div>
                  </div>
                  
                  <div class="right-logo">
                    <div id="qrcode-office" style="width: 48px; height: 38px; display: flex; align-items: center; justify-content: center;"></div>
                  </div>
                </div>
                
                <!-- Clean Company & Invoice Information Section -->
                <div class="customer-invoice-section">
                  <!-- Left Side - Company Info -->
                  <div class="customer-details">
                    <div class="font-semibold">${shopDetails?.name || 'Test company'} Limited</div>
                    <div class="mt-1">
                      <div><strong>DispatchedFrom</strong></div>
                      <div>${shopDetails?.address ? formatAddress(shopDetails.address) : 'Fertilizer Distribution Center, Hyderabad, Telangana, 500001'}</div>
                      <div>Telangana, India</div>
                      <div><strong>GSTIN:</strong> ${shopDetails?.gstNumber || '36AAACZ3924H1Z5'}</div>
                      <div><strong>MFDSID:</strong> ${shopDetails?.mfdSid || '1115736'}</div>
                    </div>
                    <div class="mt-1">
                      <div class="inline-block border border-black px-1"><strong>StateName:</strong> Telangana</div>
                    </div>
                  </div>
                  
                  <!-- Right Side - Invoice & Customer Info -->
                  <div class="invoice-details">
                    <div><strong>InvoiceNo.:</strong> ${currentBillNumber}</div>
                    <div><strong>ReceiptNo.:</strong> ${currentBillNumber}</div>
                    <div><strong>InvoiceDate:</strong> ${new Date().toLocaleDateString('en-GB')}</div>
                    <div><strong>LicenseNo.:</strong> ${shopDetails?.licenseNumber || 'NGKL/20/ADA/FR/2019/23125'}</div>
                    
                    <div class="mt-2">
                      <div><strong>BilledCustomer(Billto)</strong></div>
                      <div><strong>CustomerNo.:</strong> ${selectedCustomer?.id || 'S35100000371'}</div>
                      <div><strong>CustomerName:</strong> ${selectedCustomer?.name || customerForm.name || 'Walk-in Customer'}</div>
                      <div><strong>Village:</strong> ${selectedCustomer?.city || customerForm.city || 'N/A'}</div>
                      <div><strong>PhoneNo.:</strong> ${selectedCustomer?.phone || customerForm.phone || 'N/A'}</div>
                      <div><strong>SalesType:</strong> Cash Sales</div>
                      <div><strong>CustomerGSTNo:</strong> ${selectedCustomer?.gstNumber || customerForm.gstNumber || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                
                <!-- Items Table -->
                <table class="items-table">
                  <thead>
                    <tr>
                      <th style="width: 4%;">S.No</th>
                      <th style="width: 25%;">Description of Goods</th>
                      <th style="width: 6%;">Item Code</th>
                      <th style="width: 6%;">HSN/SAC</th>
                      <th style="width: 5%;">Batch No.</th>
                      <th style="width: 5%;">Expiry</th>
                      <th style="width: 8%;">Qty & Unit</th>
                      <th style="width: 4%;">Pack</th>
                      <th style="width: 6%;">Rate</th>
                      <th style="width: 6%;">Amount</th>
                      <th style="width: 5%;">Discount</th>
                      <th style="width: 6%;">Taxable</th>
                      <th style="width: 3%;">CGST%</th>
                      <th style="width: 5%;">CGST</th>
                      <th style="width: 3%;">SGST%</th>
                      <th style="width: 5%;">SGST</th>
                      <th style="width: 3%;">IGST%</th>
                      <th style="width: 5%;">IGST</th>
                      <th style="width: 6%;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${cart.map((item, index) => {
                      const itemTotal = item.price * item.quantity;
                      const gstRate = item.gstRate || 5;
                      const taxableAmount = itemTotal;
                      const gstAmount = (itemTotal * gstRate) / 100;
                      const cgstAmount = gstAmount / 2;
                      const sgstAmount = gstAmount / 2;
                      const totalWithTax = itemTotal + gstAmount;
                      
                      return `
                        <tr>
                          <td>${index + 1}</td>
                          <td class="product-name">${item.name}</td>
                          <td>${item.barcode || 'N/A'}</td>
                          <td>${item.hsn || '31051000'}</td>
                          <td>N/A</td>
                          <td>N/A</td>
                          <td>${item.quantity} ${item.unit || 'BAG'}</td>
                          <td>BAG</td>
                          <td>₹${item.price.toFixed(2)}</td>
                          <td class="amount-col">₹${itemTotal.toFixed(2)}</td>
                          <td>₹0.00</td>
                          <td class="amount-col">₹${taxableAmount.toFixed(2)}</td>
                          <td>${(gstRate/2).toFixed(1)}</td>
                          <td>₹${cgstAmount.toFixed(2)}</td>
                          <td>${(gstRate/2).toFixed(1)}</td>
                          <td>₹${sgstAmount.toFixed(2)}</td>
                          <td>0.0</td>
                          <td>₹0.00</td>
                          <td class="amount-col">₹${totalWithTax.toFixed(2)}</td>
                        </tr>
                      `;
                    }).join('')}
                    
                    <!-- Grand Total Row -->
                    <tr class="total-row">
                      <td colspan="9"><strong>Grand Total</strong></td>
                      <td class="amount-col"><strong>₹${subtotal.toFixed(2)}</strong></td>
                      <td><strong>₹${discountAmount.toFixed(2)}</strong></td>
                      <td class="amount-col"><strong>₹${(subtotal - discountAmount).toFixed(2)}</strong></td>
                      <td></td>
                      <td><strong>₹${(taxAmount/2).toFixed(2)}</strong></td>
                      <td></td>
                      <td><strong>₹${(taxAmount/2).toFixed(2)}</strong></td>
                      <td></td>
                      <td><strong>₹0.00</strong></td>
                      <td class="amount-col"><strong>₹${total.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
                
                <!-- Total Amount and Words Section -->
                <div class="total-amount-section">
                  <div class="amount-words">
                    <strong>Total Invoice Value (in words):</strong> ${numberToWordsIndian(Math.round(total))} Only
                  </div>
                  <div class="total-amount-display">
                    <div class="grand-total-display">₹${total.toFixed(2)}</div>
                    <div class="total-amount-label">Total Amount (incl. tax)</div>
                  </div>
                </div>
                
                <!-- Footer Section -->
                <div class="footer-section">
                  <div class="terms-section">
                    <strong>Terms & Conditions:</strong> Goods once sold will not be taken back<br>
                    This invoice is not payable under reverse charge
                  </div>
                  <div class="payment-section">
                    <strong>Payment Method:</strong> ${paymentData.method?.toUpperCase() || 'CASH'}<br>
                    <strong>Amount Received:</strong> ₹${paymentData.amountReceived?.toFixed(2) || total.toFixed(2)}<br>
                    <strong>Change:</strong> ₹${Math.max(0, (paymentData.amountReceived || total) - total).toFixed(2)}
                  </div>
                </div>
                
                <!-- Signatures -->
                <div class="signature-section">
                  <div class="company-signature">
                    <strong>For ${shopDetails?.name || 'KrishiSethu Fertilizers'}</strong>
                    <div class="signature-line">Authorized Signatory</div>
                  </div>
                  <div class="customer-signature">
                    <strong>Customer Signature</strong><br>
                    <strong>For Acknowledgement</strong>
                    <div class="signature-line">Customer</div>
                  </div>
                </div>
                
                <!-- Footer Note -->
                <div style="text-align: center; font-size: 5px; margin-top: 1px; padding-top: 1px; border-top: 1px solid #ccc;">
                  Note: Unless otherwise stated, tax on this invoice is not payable under reverse charge
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();

      // Generate QR codes and wait for content to load then print
      setTimeout(async () => {
        try {
          // Generate QR code for customer copy
          const qrDataCustomer = `Invoice: ${currentBillNumber}\nAmount: ₹${total.toFixed(2)}\nDate: ${new Date().toLocaleDateString()}\nCustomer: ${selectedCustomer?.name || customerForm.name || 'Walk-in Customer'}`;
          
          const qrCanvas1 = printWindow.document.getElementById('qrcode-customer');
          const qrCanvas2 = printWindow.document.getElementById('qrcode-office');
          
          if (qrCanvas1 && qrCanvas2) {
            // Generate QR code data URLs
            const qrDataURL = await QRCode.toDataURL(qrDataCustomer, {
              width: 48,
              height: 38,
              margin: 1
            });
            
            // Create images and set the QR code
            qrCanvas1.innerHTML = `<img src="${qrDataURL}" style="width: 48px; height: 38px;" />`;
            qrCanvas2.innerHTML = `<img src="${qrDataURL}" style="width: 48px; height: 38px;" />`;
          }
        } catch (error) {
          console.error('Error generating QR code:', error);
          // Fallback text if QR code generation fails
          const qrCanvas1 = printWindow.document.getElementById('qrcode-customer');
          const qrCanvas2 = printWindow.document.getElementById('qrcode-office');
          if (qrCanvas1) qrCanvas1.innerHTML = '<div style="font-size: 6px; text-align: center;">QR Code</div>';
          if (qrCanvas2) qrCanvas2.innerHTML = '<div style="font-size: 6px; text-align: center;">QR Code</div>';
        }
        
        // Wait a bit more for QR codes to render
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 500);
      }, 800);
    }
  };

  // Handle customer form
  const handleCustomerFormChange = (e) => {
    const { name, value } = e.target;
    setCustomerForm(prev => ({ ...prev, [name]: value }));
  };

  const saveCustomer = async () => {
    if (customerForm.name.trim() && customerForm.phone.trim()) {
      try {
        const newCustomer = {
          id: Date.now().toString(),
          ...customerForm,
          creditLimit: parseFloat(customerForm.creditLimit) || 0,
          currentCredit: 0,
          totalPurchases: 0,
          status: 'Active',
          createdAt: new Date()
        };

        // Save to Firebase (in real app)
        // await customersService.add(newCustomer);

        // Update local state
        setCustomers(prev => [newCustomer, ...prev]);
        setSelectedCustomer(newCustomer);

        // Reset form
        setCustomerForm({
          name: '',
          phone: '',
          address: '',
          email: '',
          city: '',
          pincode: '',
          gstNumber: '',
          creditLimit: 0,
          notes: ''
        });

        setShowCustomerDialog(false);
        alert('Customer added successfully!');
      } catch (error) {
        console.error('Error saving customer:', error);
        alert('Error saving customer');
      }
    } else {
      alert('Please fill in required fields (Name and Phone)');
    }
  };

  // Share functionality
  const shareInvoice = async (method) => {
    const invoiceData = {
      billNumber: currentBillNumber,
      customerName: selectedCustomer?.name || customerForm.name || 'Walk-in Customer',
      items: cart,
      subtotal: subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: total,
      date: new Date().toLocaleDateString('en-IN'),
      shopName: shopDetails?.name || 'KrishiSethu Fertilizers',
      shopPhone: shopDetails?.phone || '+91-9876543210'
    };

    const invoiceText = `🧾 *INVOICE DETAILS*

📋 Bill No: ${invoiceData.billNumber}
👤 Customer: ${invoiceData.customerName}
📅 Date: ${invoiceData.date}
🏪 Shop: ${invoiceData.shopName}
📞 Phone: ${invoiceData.shopPhone}

📦 *ITEMS:*
${cart.map((item, index) => 
  `${index + 1}. ${item.name}\n   Qty: ${item.quantity} × ₹${item.price} = ₹${(item.price * item.quantity).toFixed(2)}`
).join('\n\n')}

💰 *BILLING SUMMARY:*
• Subtotal: ₹${subtotal.toFixed(2)}
• Discount: -₹${discountAmount.toFixed(2)}
• Tax (GST): ₹${taxAmount.toFixed(2)}
• *Total Amount: ₹${total.toFixed(2)}*

💳 Payment: ${paymentData.method?.toUpperCase() || 'CASH'}

${invoiceData.total > 0 ? `📝 Amount in words: ${numberToWordsIndian(Math.round(total))} Only` : ''}

✅ Thank you for your business!

---
${invoiceData.shopName}
${shopDetails?.address ? formatAddress(shopDetails.address) : 'Agricultural Products & Fertilizers'}
GSTIN: ${shopDetails?.gstNumber || 'N/A'}`;

    try {
      switch (method) {
        case 'whatsapp':
          const customerPhone = selectedCustomer?.phone || customerForm.phone;
          let whatsappUrl;
          
          if (customerPhone) {
            // Format phone number for WhatsApp (remove +91, spaces, hyphens)
            const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
            const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
            whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(invoiceText)}`;
          } else {
            // Open WhatsApp web without specific number
            whatsappUrl = `https://wa.me/?text=${encodeURIComponent(invoiceText)}`;
          }
          
          window.open(whatsappUrl, '_blank');
          break;

        case 'email':
          const emailSubject = `Invoice ${invoiceData.billNumber} - ${invoiceData.shopName}`;
          const emailBody = invoiceText.replace(/\*/g, '').replace(/\n/g, '%0D%0A');
          const customerEmail = selectedCustomer?.email || customerForm.email;
          
          const mailtoUrl = `mailto:${customerEmail || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
          window.location.href = mailtoUrl;
          break;

        case 'copy':
          await navigator.clipboard.writeText(invoiceText);
          // Show success notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
          notification.textContent = '✅ Invoice details copied to clipboard!';
          document.body.appendChild(notification);
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 3000);
          break;

        case 'sms':
          const smsText = `Invoice ${invoiceData.billNumber} - Total: ₹${total.toFixed(2)} from ${invoiceData.shopName}. Thank you!`;
          const smsPhone = selectedCustomer?.phone || customerForm.phone;
          const smsUrl = `sms:${smsPhone || ''}?body=${encodeURIComponent(smsText)}`;
          window.location.href = smsUrl;
          break;

        default:
          console.log('Unknown share method:', method);
      }
      
      setShowShareDialog(false);
    } catch (error) {
      console.error('Error sharing invoice:', error);
      alert('Failed to share invoice. Please try again.');
    }
  };

  // Start new sale
  const startNewSale = () => {
    setCart([]);
    setSelectedCustomer(null);
    setPaymentData({ method: 'cash', cardNumber: '', upiId: '' });
    setCurrentBillNumber(generateBillNumber());
    setCustomerForm({ name: '', phone: '', address: '' });
    setShowReceiptDialog(false);
    setCustomGSTRate(null); // Reset custom GST rate
    setDiscount(0);
    setDiscountReason('');
  };

  // Debug function to test sales retrieval from Supabase
  const testSalesRetrieval = async () => {
    try {
      console.log('🧪 Testing Supabase sales retrieval...');
      const allSales = await salesService.getAll();
      console.log('📊 All sales in Supabase database:', allSales);

      if (allSales.length === 0) {
        console.warn('⚠️ No sales found in Supabase database');
      } else {
        console.log(`✅ Found ${allSales.length} sales in Supabase`);
        console.log('Latest sale:', allSales[0]);
      }
    } catch (error) {
      console.error('❌ Error retrieving sales from Supabase:', error);
    }
  };

  // Test function to create a minimal sale matching exact schema
  const testMinimalSale = async () => {
    try {
      console.log('🧪 Testing minimal sale creation with exact schema...');
      const minimalSale = {
        // Required fields only
        sale_number: `TEST_${Date.now()}`,
        customer_name: 'Test Customer',

        // Financial fields as numbers
        subtotal: 100.00,
        discount: 0.00,
        tax_amount: 18.00,
        total_amount: 118.00,

        // Payment fields
        payment_method: 'cash',
        amount_paid: 118.00,
        payment_status: 'completed',

        // Optional fields
        status: 'completed',
        notes: 'Test sale from POS - should show ₹118',
        sale_date: new Date().toISOString().split('T')[0],

        // Test items array
        items: [
          {
            product_name: 'Test Product 1',
            quantity: 2,
            unit_price: 50.00,
            total_price: 100.00,
            gst_rate: 18.00
          }
        ]
      };

      console.log('📤 Sending minimal sale data:', minimalSale);
      console.log('💰 Expected total_amount: ₹118');
      const result = await salesService.create(minimalSale);
      console.log('✅ Minimal sale created successfully:', result);
      console.log('💰 Actual saved total_amount:', result.total_amount);

      // Refresh sales history to see the new sale
      alert(`✅ Test sale created! Check Sales History - should show ₹118 total`);
    } catch (error) {
      console.error('❌ Error creating minimal sale:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }
  };

  return (
    <>
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-card shadow-sm border-b p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-bold text-foreground">Point of Sale</h1>
            </div>
            <Badge variant="outline" className="text-sm">
              Bill #{currentBillNumber}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImageUploadDialog(true)}
              className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <Upload className="h-3 w-3 mr-1" />
              UPLOAD IMAGES
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {new Date().toLocaleTimeString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showBarcodeDialog} onOpenChange={setShowBarcodeDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Scan className="h-4 w-4 mr-2" />
                  Scan Barcode
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="barcode-scanner-description">
                <DialogHeader>
                  <DialogTitle>Barcode Scanner</DialogTitle>
                  <DialogDescription id="barcode-scanner-description">
                    Scan or enter product barcode/ID to add to cart
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter barcode or product ID"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                    />
                    <Button onClick={handleBarcodeSearch}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <Button
                      onClick={openBarcodeScanner}
                      className="w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera Scan
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={clearCart}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate('sales')}>
              <Receipt className="h-4 w-4 mr-2" />
              Sales History
            </Button>
            <Button variant="outline" size="sm" onClick={testSalesRetrieval}>
              🧪 Test Supabase
            </Button>
            <Button variant="outline" size="sm" onClick={testMinimalSale}>
              🧪 Test Minimal Sale
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
              ← Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Product Search & Selection */}
        <div className="w-1/2 p-6 border-r bg-background overflow-y-auto">
          <div className="space-y-6">
            {/* Enhanced Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                    <Input
                      placeholder="Search products by name, brand, or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 text-lg h-12"
                    />
                  </div>

                  {/* Enhanced Customer Selection */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Dialog open={showCustomerSelectDialog} onOpenChange={setShowCustomerSelectDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1 justify-start" size="lg">
                            <User className="h-4 w-4 mr-2" />
                            {selectedCustomer ? (
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{selectedCustomer.name}</span>
                                <span className="text-xs text-gray-500">{selectedCustomer.phone}</span>
                              </div>
                            ) : (
                              'Select Customer'
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl" aria-describedby="customer-select-description">
                          <DialogHeader>
                            <DialogTitle>Select Customer</DialogTitle>
                            <DialogDescription id="customer-select-description">
                              Choose an existing customer or add a new one
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            <div className="grid gap-2">
                              <Button
                                variant="outline"
                                onClick={() => selectCustomer(null)}
                                className="justify-start h-auto p-4"
                              >
                                <User className="h-5 w-5 mr-3" />
                                <div className="text-left">
                                  <div className="font-medium">Walk-in Customer</div>
                                  <div className="text-sm text-gray-500">No customer details required</div>
                                </div>
                              </Button>
                              {customers.map((customer) => (
                                <Button
                                  key={customer.id}
                                  variant="outline"
                                  onClick={() => selectCustomer(customer)}
                                  className="justify-start h-auto p-4"
                                >
                                  <div className="flex items-center w-full">
                                    <Users className="h-5 w-5 mr-3" />
                                    <div className="text-left flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{customer.name}</span>
                                        {customer.status === 'VIP' && (
                                          <Badge variant="secondary" className="text-xs">
                                            <Star className="h-3 w-3 mr-1" />
                                            VIP
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        <div className="flex items-center gap-4">
                                          <span className="flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {customer.phone}
                                          </span>
                                          {customer.email && (
                                            <span className="flex items-center gap-1">
                                              <Mail className="h-3 w-3" />
                                              {customer.email}
                                            </span>
                                          )}
                                        </div>
                                        {customer.address && (
                                          <div className="flex items-center gap-1 mt-1">
                                            <MapPin className="h-3 w-3" />
                                            {formatAddress(customer.address)}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-4 mt-1">
                                          <span className="flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            Total: ₹{customer.totalPurchases?.toLocaleString() || 0}
                                          </span>
                                          <span className="text-xs">
                                            Credit: ₹{customer.currentCredit || 0} / ₹{customer.creditLimit || 0}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {selectedCustomer && (
                        <Button variant="outline" size="lg" onClick={removeCustomer}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="lg">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add New
                          </Button>
                        </DialogTrigger>
                <DialogContent className="max-w-2xl" aria-describedby="add-customer-description">
                  <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription id="add-customer-description">Enter customer details to create a new customer profile</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Customer Name *</label>
                        <Input
                          name="name"
                          placeholder="Enter full name"
                          value={customerForm.name}
                          onChange={handleCustomerFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number *</label>
                        <Input
                          name="phone"
                          placeholder="+91-9876543210"
                          value={customerForm.phone}
                          onChange={handleCustomerFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <Input
                          name="email"
                          type="email"
                          placeholder="customer@example.com"
                          value={customerForm.email}
                          onChange={handleCustomerFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">GST Number</label>
                        <Input
                          name="gstNumber"
                          placeholder="27AAAAA0000A1Z5"
                          value={customerForm.gstNumber}
                          onChange={handleCustomerFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">City</label>
                        <Input
                          name="city"
                          placeholder="Mumbai"
                          value={customerForm.city}
                          onChange={handleCustomerFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">PIN Code</label>
                        <Input
                          name="pincode"
                          placeholder="400001"
                          value={customerForm.pincode}
                          onChange={handleCustomerFormChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Credit Limit (₹)</label>
                        <Input
                          name="creditLimit"
                          type="number"
                          placeholder="50000"
                          value={customerForm.creditLimit}
                          onChange={handleCustomerFormChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Address</label>
                      <Input
                        name="address"
                        placeholder="Complete address"
                        value={customerForm.address}
                        onChange={handleCustomerFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes</label>
                      <Input
                        name="notes"
                        placeholder="Additional notes about customer"
                        value={customerForm.notes}
                        onChange={handleCustomerFormChange}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveCustomer} disabled={!customerForm.name.trim() || !customerForm.phone.trim()}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Save Customer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Category Tabs */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {categoriesLoading ? (
                <div className="text-sm text-gray-500 px-3 py-2">
                  Loading categories...
                </div>
              ) : (
                <>
                  <Button
                    key="All Items"
                    variant={'All Items' === selectedCategory ? 'default' : 'outline'}
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => handleCategorySelect('All Items')}
                  >
                    All Items ({products.length})
                  </Button>
                  {categories.map((category) => {
                    // Count products for this category
                    const categoryProducts = products.filter(product => {
                      const productCategory = (product.category || '').toLowerCase().trim();
                      const categoryName = category.name.toLowerCase().trim();
                      return productCategory === categoryName ||
                             productCategory.includes(categoryName) ||
                             categoryName.includes(productCategory);
                    });

                    return (
                      <Button
                        key={category.id}
                        variant={category.name === selectedCategory ? 'default' : 'outline'}
                        size="sm"
                        className="whitespace-nowrap"
                        onClick={() => handleCategorySelect(category.name)}
                      >
                        {category.name} ({categoryProducts.length})
                      </Button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Debug Info - Show category filtering status */}
            {selectedCategory !== 'All Items' && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                <strong>Filtering by:</strong> {selectedCategory} •
                <strong> Found:</strong> {filteredProducts.length} products •
                <strong> Total:</strong> {products.length} products
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Product Grid */}
        <Card className="flex-1">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border hover:border-blue-300 group"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3">
                    {/* Product Image */}
                    <div className="aspect-square bg-gradient-to-br from-green-50 to-blue-50 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            // Hide broken image and show fallback
                            e.target.style.display = 'none';
                            if (e.target.parentElement) {
                              const fallbackDiv = e.target.parentElement.querySelector('.fallback-icon');
                              if (fallbackDiv) {
                                fallbackDiv.style.display = 'flex';
                              }
                            }
                          }}
                          onLoad={(e) => {
                            // Hide fallback when image loads successfully
                            const fallbackDiv = e.target.parentElement.querySelector('.fallback-icon');
                            if (fallbackDiv) {
                              fallbackDiv.style.display = 'none';
                            }
                          }}
                        />
                      ) : null}
                      <div className="fallback-icon w-full h-full flex items-center justify-center" style={{ display: product.image ? 'none' : 'flex' }}>
                        {loadingImages ? (
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mb-1"></div>
                            <span className="text-xs text-gray-400">Loading...</span>
                          </div>
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Upload Button - Only show on hover and if no image */}
                      {!product.image && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-xs p-1 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent adding to cart
                            setSelectedProductForUpload(product);
                            setShowImageUploadDialog(true);
                          }}
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                      )}

                      {/* Stock Status Badges */}
                      {product.stock <= 5 && product.stock > 0 && (
                        <Badge className="absolute top-1 right-1 bg-orange-500 text-xs">
                          Low Stock
                        </Badge>
                      )}
                      {product.stock <= 0 && (
                        <Badge className="absolute top-1 right-1 bg-red-500 text-xs">
                          Out of Stock
                        </Badge>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500">{product.brand}</p>

                      {/* Price */}
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-green-600 text-base">₹{product.price}</span>
                          {product.mrp && product.mrp > product.price && (
                            <span className="text-xs text-gray-400 line-through ml-1">₹{product.mrp}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                      </div>

                      {/* HSN and Unit */}
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>HSN: {product.hsn || 'N/A'}</span>
                        <span>{product.unit || 'PCS'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* No Products Found */}
            {filteredProducts.length === 0 && products.length === 0 && (
              <EmptyProducts
                onAddProduct={() => {
                  // Navigate to inventory page
                  if (window.location.pathname !== '/inventory') {
                    window.location.href = '/inventory';
                  }
                }}
              />
            )}

            {/* No Search Results */}
            {filteredProducts.length === 0 && products.length > 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No products found</p>
                <p className="text-sm text-gray-400">
                  {searchTerm ? `No results for "${searchTerm}"` : 'Try adjusting your search terms'}
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </div>

        {/* Right Panel - Cart & Billing */}
        <div className="w-1/2 p-4 flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="flex-shrink-0 pb-4">
              <CardTitle>Current Sale</CardTitle>
              <CardDescription>
                Bill #: {currentBillNumber} • Items in cart ({cart.length})
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No items in cart</p>
                  <p className="text-sm">Search and click products to add them</p>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  {/* Scrollable Cart Items Section */}
                  <div
                    className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-2"
                    style={{
                      maxHeight: '300px',
                      minHeight: '200px'
                    }}
                  >
                    <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-500">₹{item.price} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                          <span className="w-20 text-right font-medium">
                            ₹{item.price * item.quantity}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>

                  {/* Fixed Bottom Section - Discount, Totals, Buttons */}
                  <div className="flex-shrink-0 border-t pt-4 space-y-4">
                    {/* Discount Management */}
                    <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Apply Discount</span>
                      <div className="flex gap-2">
                        <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Tag className="h-4 w-4 mr-2" />
                              {discount > 0 ? 'Edit' : 'Add'} Discount
                            </Button>
                          </DialogTrigger>
                          <DialogContent aria-describedby="discount-description">
                            <DialogHeader>
                              <DialogTitle>Apply Discount</DialogTitle>
                              <DialogDescription id="discount-description">
                                Add discount to this sale with reason
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Discount Type</label>
                                <Select value={discountType} onValueChange={setDiscountType}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    <SelectItem value="amount">Fixed Amount (₹)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  Discount {discountType === 'percentage' ? 'Percentage' : 'Amount'}
                                </label>
                                <Input
                                  type="number"
                                  placeholder={discountType === 'percentage' ? '10' : '100'}
                                  value={discount}
                                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Reason for Discount *</label>
                                <Select value={discountReason} onValueChange={setDiscountReason}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select reason" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="bulk_purchase">Bulk Purchase</SelectItem>
                                    <SelectItem value="loyal_customer">Loyal Customer</SelectItem>
                                    <SelectItem value="seasonal_offer">Seasonal Offer</SelectItem>
                                    <SelectItem value="damaged_goods">Damaged Goods</SelectItem>
                                    <SelectItem value="manager_approval">Manager Approval</SelectItem>
                                    <SelectItem value="promotional">Promotional Discount</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="p-3 bg-muted rounded-lg">
                                <div className="text-sm">
                                  <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Discount:</span>
                                    <span>-₹{calculateDiscount().toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between font-medium">
                                    <span>After Discount:</span>
                                    <span>₹{(subtotal - calculateDiscount()).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowDiscountDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={applyDiscount}>
                                Apply Discount
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        {discount > 0 && (
                          <Button variant="outline" size="sm" onClick={removeDiscount}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {discount > 0 && (
                      <div className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                        <div className="flex justify-between">
                          <span>Discount Applied:</span>
                          <span className="font-medium">
                            {discountType === 'percentage' ? `${discount}%` : `₹${discount}`}
                          </span>
                        </div>
                        <div className="text-xs">Reason: {discountReason}</div>
                      </div>
                    )}
                  </div>

                  {/* GST Rate Selector */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">GST Rate</span>
                      <div className="flex gap-2">
                        <Dialog open={showGSTDialog} onOpenChange={setShowGSTDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs">
                              <Calculator className="h-3 w-3 mr-1" />
                              {customGSTRate !== null ? `Custom ${customGSTRate}%` : `Auto ${averageGSTRate.toFixed(1)}%`}
                            </Button>
                          </DialogTrigger>
                          <DialogContent aria-describedby="gst-rate-description">
                            <DialogHeader>
                              <DialogTitle>Set GST Rate</DialogTitle>
                              <DialogDescription id="gst-rate-description">
                                Choose GST rate for this entire sale
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-2">
                                {[0, 5, 12, 18].map((rate) => (
                                  <Button
                                    key={rate}
                                    variant={customGSTRate === rate ? "default" : "outline"}
                                    onClick={() => setCustomGSTRate(rate)}
                                    className="h-12"
                                  >
                                    {rate}%
                                  </Button>
                                ))}
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Custom Rate (%)</label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  placeholder="Enter custom GST rate"
                                  value={customGSTRate || ''}
                                  onChange={(e) => {
                                    const rate = parseFloat(e.target.value);
                                    setCustomGSTRate(isNaN(rate) ? null : rate);
                                  }}
                                />
                              </div>
                              <div className="p-3 bg-muted rounded-lg">
                                <div className="text-sm">
                                  <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>GST ({customGSTRate !== null ? customGSTRate : averageGSTRate.toFixed(1)}%):</span>
                                    <span>₹{taxAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between font-medium">
                                    <span>Total with GST:</span>
                                    <span>₹{total.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setCustomGSTRate(null);
                                  setShowGSTDialog(false);
                                }}
                              >
                                Reset to Auto
                              </Button>
                              <Button onClick={() => setShowGSTDialog(false)}>
                                Apply GST Rate
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    {customGSTRate !== null && (
                      <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <div className="flex justify-between">
                          <span>Custom GST Applied:</span>
                          <span className="font-medium">{customGSTRate}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span className="text-green-600">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({averageGSTRate.toFixed(1)}%):</span>
                      <span>₹{taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-4">
                    <Button variant="outline" onClick={startNewSale} className="flex-1">
                      ← Cancel Sale
                    </Button>
                    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                      <DialogTrigger asChild>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700">
                          Confirm Payment ✅
                        </Button>
                      </DialogTrigger>
                      <DialogContent aria-describedby="payment-description">
                        <DialogHeader>
                          <DialogTitle>💳 Payment</DialogTitle>
                          <DialogDescription id="payment-description">
                            Complete the payment for this sale
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          {/* Payment Method Selection */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Payment Method</label>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant={paymentData.method === 'cash' ? 'default' : 'outline'}
                                onClick={() => setPaymentData(prev => ({ ...prev, method: 'cash' }))}
                                className="flex items-center gap-2"
                              >
                                💵 Cash
                              </Button>
                              <Button
                                variant={paymentData.method === 'card' ? 'default' : 'outline'}
                                onClick={() => setPaymentData(prev => ({ ...prev, method: 'card' }))}
                                className="flex items-center gap-2"
                              >
                                💳 Card
                              </Button>
                              <Button
                                variant={paymentData.method === 'upi' ? 'default' : 'outline'}
                                onClick={() => setPaymentData(prev => ({ ...prev, method: 'upi' }))}
                                className="flex items-center gap-2"
                              >
                                📱 UPI
                              </Button>
                              <Button
                                variant={paymentData.method === 'credit' ? 'default' : 'outline'}
                                onClick={() => setPaymentData(prev => ({ ...prev, method: 'credit' }))}
                                className="flex items-center gap-2"
                              >
                                🏦 Credit
                              </Button>
                            </div>
                          </div>

                          {/* Amount Details */}
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center text-lg font-semibold">
                              <span>Total Amount:</span>
                              <span>₹{total.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Payment Amount Input */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Amount Received</label>
                            <Input
                              type="number"
                              value={paymentData.amountReceived}
                              onChange={(e) => setPaymentData(prev => ({
                                ...prev,
                                amountReceived: parseFloat(e.target.value) || 0
                              }))}
                              placeholder="Enter amount received"
                              className="text-lg"
                            />
                          </div>

                          {/* Change Calculation */}
                          {paymentData.amountReceived > 0 && (
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">Change to Return:</span>
                                <span className="text-lg font-semibold text-green-600">
                                  ₹{Math.max(0, paymentData.amountReceived - total).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <DialogFooter>
                          <Button
                            onClick={completeSale}
                            disabled={isProcessing || paymentData.amountReceived < total}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {isProcessing ? 'Processing...' : 'Complete Payment'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" aria-describedby="receipt-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🧾 Payment Receipt
              <Badge variant="outline" className="ml-auto">#{currentBillNumber}</Badge>
            </DialogTitle>
            <DialogDescription id="receipt-description">
              View and print your invoice receipt with dual copies
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {/* Receipt Content - Dual Copy Layout */}
            <div ref={receiptRef} className="receipt-content bg-white p-2" style={{
              fontFamily: 'Arial, sans-serif',
              width: '194mm',
              maxWidth: '194mm', 
              fontSize: '7px',
              lineHeight: '1.1',
              margin: '0 auto',
              overflow: 'visible',
              border: '1px solid #ddd'
            }}>

              {/* CUSTOMER COPY */}
              <div className="border-2 border-black mb-2 p-2" style={{ minHeight: '35vh' }}>
                {/* Copy Type */}
                <div className="text-center font-bold text-xs mb-1 underline">Customer Copy</div>
                
                {/* Header Section - JaiKisan Style */}
                <div className="border-b-2 border-black pb-2 mb-2">
                  {/* Top Header with Logo, Company Name, and Brand */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-16 h-12 border border-black flex items-center justify-center">
                      {shopDetails?.logo ? (
                        <img src={shopDetails.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="text-xs font-bold text-center">JAI<br/>KISAN</div>
                      )}
                    </div>
                    <div className="text-center flex-1 mx-4">
                      <div className="text-base font-bold">{shopDetails?.name || 'KrishiSethu'}</div>
                      <div className="text-sm font-bold">GST Invoice</div>
                    </div>
                    <div className="w-20 h-12 border border-black flex items-center justify-center">
                      <div className="text-xs font-bold text-blue-600">adventz</div>
                    </div>
                  </div>
                  
                  {/* Company Details Section */}
                  <div className="flex justify-between text-xs">
                    {/* Left Side - Company Info */}
                    <div className="flex-1">
                      <div className="font-semibold">{shopDetails?.name || 'KrishiSethu'} Limited</div>
                      <div><strong>Website:</strong> www.krishisethu.in</div>
                      <div><strong>CINNo:</strong> {shopDetails?.cinNumber || 'L65921GA21967PLC000157'}</div>
                      <div><strong>TollFreeNumber:</strong> {shopDetails?.phone || '18001212333'}</div>
                      <div className="mt-1">
                        <div><strong>DispatchedFrom</strong></div>
                        <div>ZACL-KALWAKURTHY</div>
                        <div>{shopDetails?.address ? formatAddress(shopDetails.address) : 'Shop no. 12-114/19&20 Hyderabad Kalwakurthy Nagar Kurnool-509324'}</div>
                        <div>Telangana, India</div>
                        <div><strong>GSTIN:</strong> {shopDetails?.gstNumber || '36AAACZ3924H1Z9'}</div>
                        <div><strong>MFDSID:</strong> {shopDetails?.mfdSid || '1115736'}</div>
                      </div>
                      <div className="mt-1">
                        <div className="inline-block border border-black px-1"><strong>StateName:</strong> Telangana</div>
                      </div>
                    </div>
                    
                    {/* Right Side - Invoice & Customer Info */}
                    <div className="flex-1 text-right">
                      <div><strong>InvoiceNo.:</strong> {currentBillNumber}</div>
                      <div><strong>ReceiptNo.:</strong> {currentBillNumber}</div>
                      <div><strong>InvoiceDate:</strong> {new Date().toLocaleDateString('en-GB')}</div>
                      <div><strong>LicenseNo.:</strong> {shopDetails?.licenseNumber || 'NGKL/20/ADA/FR/2019/23125'}</div>
                      
                      <div className="mt-2">
                        <div><strong>BilledCustomer(Billto)</strong></div>
                        <div><strong>CustomerNo.:</strong> {selectedCustomer?.id || 'S35100000371'}</div>
                        <div><strong>CustomerName:</strong> {selectedCustomer?.name || customerForm.name || 'Walk-in Customer'}</div>
                        <div><strong>Village:</strong> {selectedCustomer?.city || customerForm.city || 'N/A'}</div>
                        <div><strong>PhoneNo.:</strong> {selectedCustomer?.phone || customerForm.phone || 'N/A'}</div>
                        <div><strong>SalesType:</strong> Cash Sales</div>
                        <div><strong>CustomerGSTNo:</strong> {selectedCustomer?.gstNumber || customerForm.gstNumber || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Customer and Invoice Details - Now integrated in header */}
                
                {/* Items Table */}
                <table className="w-full border-collapse border border-black mb-1" style={{ fontSize: '6px' }}>
                  <thead>
                    <tr>
                      <th className="border border-black p-0.5">S.No</th>
                      <th className="border border-black p-0.5">Product</th>
                      <th className="border border-black p-0.5">HSN</th>
                      <th className="border border-black p-0.5">Qty</th>
                      <th className="border border-black p-0.5">Rate</th>
                      <th className="border border-black p-0.5">CGST</th>
                      <th className="border border-black p-0.5">SGST</th>
                      <th className="border border-black p-0.5">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, index) => {
                      const itemTotal = item.price * item.quantity;
                      const gstRate = item.gstRate || 5;
                      const taxableAmount = itemTotal / (1 + gstRate / 100);
                      const gstAmount = itemTotal - taxableAmount;
                      const cgstAmount = gstAmount / 2;
                      const sgstAmount = gstAmount / 2;
                      
                      return (
                        <tr key={index}>
                          <td className="border border-black p-0.5 text-center">{index + 1}</td>
                          <td className="border border-black p-0.5">{item.name}</td>
                          <td className="border border-black p-0.5 text-center">{item.hsn || '31051000'}</td>
                          <td className="border border-black p-0.5 text-center">{item.quantity}</td>
                          <td className="border border-black p-0.5 text-right">₹{item.price.toFixed(2)}</td>
                          <td className="border border-black p-0.5 text-right">₹{cgstAmount.toFixed(2)}</td>
                          <td className="border border-black p-0.5 text-right">₹{sgstAmount.toFixed(2)}</td>
                          <td className="border border-black p-0.5 text-right font-bold">₹{itemTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    
                    {/* Grand Total Row */}
                    <tr>
                      <td colSpan="7" className="border border-black p-0.5 text-center font-bold">Grand Total</td>
                      <td className="border border-black p-0.5 text-right font-bold">₹{total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
                
                {/* Grand Total and Details */}
                <div className="text-center text-sm font-bold mb-1">₹{total.toFixed(2)}</div>
                <div className="text-center text-xs mb-1">
                  <strong>Total Invoice Value (in words):</strong> {numberToWordsIndian(Math.round(total))} Only
                </div>
                
                {/* Footer */}
                <div className="flex justify-between text-xs">
                  <div>
                    <strong>Terms & Conditions:</strong> Goods once sold will not be taken back<br />
                    This invoice is not payable under reverse charge
                  </div>
                  <div className="text-right">
                    <strong>Payment:</strong> {paymentData.method?.toUpperCase() || 'CASH'}<br />
                    <strong>Received:</strong> ₹{paymentData.amountReceived?.toFixed(2) || total.toFixed(2)}<br />
                    <strong>Change:</strong> ₹{Math.max(0, (paymentData.amountReceived || total) - total).toFixed(2)}
                  </div>
                </div>
                
                {/* Signatures */}
                <div className="flex justify-between text-xs mt-2">
                  <div>
                    <strong>For {shopDetails?.name || 'KrishiSethu Fertilizers'}</strong>
                    <div className="border-t border-black mt-4 pt-1">Authorized Signatory</div>
                  </div>
                  <div className="text-right">
                    <strong>Customer Signature</strong>
                    <div className="border-t border-black mt-4 pt-1">Customer</div>
                  </div>
                </div>
              </div>

              {/* OFFICE/AUDIT COPY */}
              <div className="border-2 border-black mb-2 p-2" style={{ minHeight: '35vh' }}>
                {/* Copy Type */}
                <div className="text-center font-bold text-xs mb-1 underline">Office Copy</div>
                
                {/* Header Section - JaiKisan Style */}
                <div className="border-b-2 border-black pb-2 mb-2">
                  {/* Top Header with Logo, Company Name, and Brand */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-16 h-12 border border-black flex items-center justify-center">
                      {shopDetails?.logo ? (
                        <img src={shopDetails.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="text-xs font-bold text-center">JAI<br/>KISAN</div>
                      )}
                    </div>
                    <div className="text-center flex-1 mx-4">
                      <div className="text-base font-bold">{shopDetails?.name || 'KrishiSethu'}</div>
                      <div className="text-sm font-bold">GST Invoice</div>
                    </div>
                    <div className="w-20 h-12 border border-black flex items-center justify-center">
                      <div className="text-xs font-bold text-blue-600">adventz</div>
                    </div>
                  </div>
                  
                  {/* Company Details Section */}
                  <div className="flex justify-between text-xs">
                    {/* Left Side - Company Info */}
                    <div className="flex-1">
                      <div className="font-semibold">{shopDetails?.name || 'KrishiSethu'} Limited</div>
                      <div><strong>Website:</strong> www.krishisethu.in</div>
                      <div><strong>CINNo:</strong> {shopDetails?.cinNumber || 'L65921GA21967PLC000157'}</div>
                      <div><strong>TollFreeNumber:</strong> {shopDetails?.phone || '18001212333'}</div>
                      <div className="mt-1">
                        <div><strong>DispatchedFrom</strong></div>
                        <div>ZACL-KALWAKURTHY</div>
                        <div>{shopDetails?.address ? formatAddress(shopDetails.address) : 'Shop no. 12-114/19&20 Hyderabad Kalwakurthy Nagar Kurnool-509324'}</div>
                        <div>Telangana, India</div>
                        <div><strong>GSTIN:</strong> {shopDetails?.gstNumber || '36AAACZ3924H1Z9'}</div>
                        <div><strong>MFDSID:</strong> {shopDetails?.mfdSid || '1115736'}</div>
                      </div>
                      <div className="mt-1">
                        <div className="inline-block border border-black px-1"><strong>StateName:</strong> Telangana</div>
                      </div>
                    </div>
                    
                    {/* Right Side - Invoice & Customer Info */}
                    <div className="flex-1 text-right">
                      <div><strong>InvoiceNo.:</strong> {currentBillNumber}</div>
                      <div><strong>ReceiptNo.:</strong> {currentBillNumber}</div>
                      <div><strong>InvoiceDate:</strong> {new Date().toLocaleDateString('en-GB')}</div>
                      <div><strong>LicenseNo.:</strong> {shopDetails?.licenseNumber || 'NGKL/20/ADA/FR/2019/23125'}</div>
                      
                      <div className="mt-2">
                        <div><strong>BilledCustomer(Billto)</strong></div>
                        <div><strong>CustomerNo.:</strong> {selectedCustomer?.id || 'S35100000371'}</div>
                        <div><strong>CustomerName:</strong> {selectedCustomer?.name || customerForm.name || 'Walk-in Customer'}</div>
                        <div><strong>Village:</strong> {selectedCustomer?.city || customerForm.city || 'N/A'}</div>
                        <div><strong>PhoneNo.:</strong> {selectedCustomer?.phone || customerForm.phone || 'N/A'}</div>
                        <div><strong>SalesType:</strong> Cash Sales</div>
                        <div><strong>CustomerGSTNo:</strong> {selectedCustomer?.gstNumber || customerForm.gstNumber || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Customer and Invoice Details - Now integrated in header */}
                
                {/* Items Table */}
                <table className="w-full border-collapse border border-black mb-1" style={{ fontSize: '6px' }}>
                  <thead>
                    <tr>
                      <th className="border border-black p-0.5">S.No</th>
                      <th className="border border-black p-0.5">Product</th>
                      <th className="border border-black p-0.5">HSN</th>
                      <th className="border border-black p-0.5">Qty</th>
                      <th className="border border-black p-0.5">Rate</th>
                      <th className="border border-black p-0.5">CGST</th>
                      <th className="border border-black p-0.5">SGST</th>
                      <th className="border border-black p-0.5">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, index) => {
                      const itemTotal = item.price * item.quantity;
                      const gstRate = item.gstRate || 5;
                      const taxableAmount = itemTotal / (1 + gstRate / 100);
                      const gstAmount = itemTotal - taxableAmount;
                      const cgstAmount = gstAmount / 2;
                      const sgstAmount = gstAmount / 2;
                      
                      return (
                        <tr key={index}>
                          <td className="border border-black p-0.5 text-center">{index + 1}</td>
                          <td className="border border-black p-0.5">{item.name}</td>
                          <td className="border border-black p-0.5 text-center">{item.hsn || '31051000'}</td>
                          <td className="border border-black p-0.5 text-center">{item.quantity}</td>
                          <td className="border border-black p-0.5 text-right">₹{item.price.toFixed(2)}</td>
                          <td className="border border-black p-0.5 text-right">₹{cgstAmount.toFixed(2)}</td>
                          <td className="border border-black p-0.5 text-right">₹{sgstAmount.toFixed(2)}</td>
                          <td className="border border-black p-0.5 text-right font-bold">₹{itemTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    
                    {/* Grand Total Row */}
                    <tr>
                      <td colSpan="7" className="border border-black p-0.5 text-center font-bold">Grand Total</td>
                      <td className="border border-black p-0.5 text-right font-bold">₹{total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
                
                {/* Grand Total and Details */}
                <div className="text-center text-sm font-bold mb-1">₹{total.toFixed(2)}</div>
                <div className="text-center text-xs mb-1">
                  <strong>Total Invoice Value (in words):</strong> {numberToWordsIndian(Math.round(total))} Only
                </div>
                
                {/* Footer */}
                <div className="flex justify-between text-xs">
                  <div>
                    <strong>Terms & Conditions:</strong> Goods once sold will not be taken back<br />
                    This invoice is not payable under reverse charge
                  </div>
                  <div className="text-right">
                    <strong>Payment:</strong> {paymentData.method?.toUpperCase() || 'CASH'}<br />
                    <strong>Received:</strong> ₹{paymentData.amountReceived?.toFixed(2) || total.toFixed(2)}<br />
                    <strong>Change:</strong> ₹{Math.max(0, (paymentData.amountReceived || total) - total).toFixed(2)}
                  </div>
                </div>
                
                {/* Signatures */}
                <div className="flex justify-between text-xs mt-2">
                  <div>
                    <strong>For {shopDetails?.name || 'KrishiSethu Fertilizers'}</strong>
                    <div className="border-t border-black mt-4 pt-1">Authorized Signatory</div>
                  </div>
                  <div className="text-right">
                    <strong>Customer Signature</strong>
                    <div className="border-t border-black mt-4 pt-1">Customer</div>
                  </div>
                </div>
                
                {/* Footer Note */}
                <div className="text-center text-xs mt-1 pt-1 border-t border-gray-400">
                  Note: Unless otherwise stated, tax on this invoice is not payable under reverse charge
                </div>
              </div>

            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={printReceipt}>
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" aria-describedby="share-invoice-description">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Share Invoice
                  </DialogTitle>
                  <DialogDescription id="share-invoice-description">
                    Share invoice details with your customer
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Customer Info Display */}
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">Invoice: {currentBillNumber}</div>
                      <div className="text-gray-600">
                        Customer: {selectedCustomer?.name || customerForm.name || 'Walk-in Customer'}
                      </div>
                      <div className="text-gray-600">
                        Total: ₹{total.toFixed(2)}
                      </div>
                      {selectedCustomer?.phone && (
                        <div className="text-gray-600">
                          📞 {selectedCustomer.phone}
                        </div>
                      )}
                      {selectedCustomer?.email && (
                        <div className="text-gray-600">
                          ✉️ {selectedCustomer.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Share Options */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* WhatsApp */}
                    <Button
                      variant="outline"
                      onClick={() => shareInvoice('whatsapp')}
                      className="h-20 flex flex-col items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                      <MessageCircle className="h-6 w-6" />
                      <span className="text-sm font-medium">WhatsApp</span>
                      <span className="text-xs text-gray-500">
                        {selectedCustomer?.phone ? 'Send to customer' : 'Choose contact'}
                      </span>
                    </Button>

                    {/* Email */}
                    <Button
                      variant="outline"
                      onClick={() => shareInvoice('email')}
                      className="h-20 flex flex-col items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <Mail className="h-6 w-6" />
                      <span className="text-sm font-medium">Email</span>
                      <span className="text-xs text-gray-500">
                        {selectedCustomer?.email ? 'Send to customer' : 'Choose email'}
                      </span>
                    </Button>

                    {/* Copy to Clipboard */}
                    <Button
                      variant="outline"
                      onClick={() => shareInvoice('copy')}
                      className="h-20 flex flex-col items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                    >
                      <Copy className="h-6 w-6" />
                      <span className="text-sm font-medium">Copy Text</span>
                      <span className="text-xs text-gray-500">Copy to clipboard</span>
                    </Button>

                    {/* SMS */}
                    <Button
                      variant="outline"
                      onClick={() => shareInvoice('sms')}
                      className="h-20 flex flex-col items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                    >
                      <MessageCircle className="h-6 w-6" />
                      <span className="text-sm font-medium">SMS</span>
                      <span className="text-xs text-gray-500">
                        {selectedCustomer?.phone ? 'Send SMS' : 'Choose number'}
                      </span>
                    </Button>
                  </div>

                  {/* Additional Options */}
                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-600 mb-2">More Options:</div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={printReceipt}
                        className="flex-1"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Generate PDF and download
                          alert('PDF download feature coming soon!');
                        }}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  {/* Preview Text */}
                  <details className="border rounded-lg p-3">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Preview Share Text
                    </summary>
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {`🧾 INVOICE DETAILS

📋 Bill No: ${currentBillNumber}
👤 Customer: ${selectedCustomer?.name || customerForm.name || 'Walk-in Customer'}
📅 Date: ${new Date().toLocaleDateString('en-IN')}

💰 Total Amount: ₹${total.toFixed(2)}

✅ Thank you for your business!`}
                    </div>
                  </details>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={startNewSale} className="bg-green-600 hover:bg-green-700">
              🔁 New Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Image Upload Dialog */}
      <Dialog open={showImageUploadDialog} onOpenChange={setShowImageUploadDialog}>
        <DialogContent className="max-w-md" aria-describedby="image-upload-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Product Images
            </DialogTitle>
            <DialogDescription id="image-upload-description">
              Select a product and upload an image for it
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Product</label>
              <Select
                value={selectedProductForUpload?.id || ''}
                onValueChange={(productId) => {
                  const product = products.find(p => p.id === productId);
                  setSelectedProductForUpload(product);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>{product.name}</span>
                        {product.image && (
                          <Badge variant="secondary" className="text-xs">
                            Has Image
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            {selectedProductForUpload && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Upload Image for: <span className="font-bold">{selectedProductForUpload.name}</span>
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleImageUpload(file, selectedProductForUpload);
                    }
                  }}
                  disabled={uploadingImage}
                />
                <p className="text-xs text-gray-500">
                  Supported formats: JPG, PNG, GIF (Max 5MB)
                </p>
              </div>
            )}

            {uploadingImage && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Upload className="h-4 w-4 animate-spin" />
                Uploading image...
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImageUploadDialog(false);
                setSelectedProductForUpload(null);
              }}
              disabled={uploadingImage}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Component */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onScan={handleBarcodeScan}
        onClose={closeBarcodeScanner}
      />
    </div>
    </>
  );
};



export default POS;
