import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { customersService, salesService, productsService } from '../lib/supabaseDb';
import { shopDetailsService } from '../lib/shopDetails';
import { imageService } from '../lib/imageService';
import { barcodeService } from '../lib/barcodeService';
import { thermalPrintService } from '../lib/thermalPrintService';
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
  Upload
} from 'lucide-react';

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
  const [tax, setTax] = useState(18); // GST percentage
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
            gstNumber: '27AAAAA0000A1Z5'
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
          gstNumber: '27AAAAA0000A1Z5'
        });
      }
    };

    const loadProducts = async () => {
      try {
        // Use real Firebase data
        const firebaseProducts = await productsService.getAll();
        const posProducts = firebaseProducts.map(product => ({
          id: product.id,
          name: product.name,
          brand: product.brand,
          price: product.salePrice,
          mrp: product.mrp || product.salePrice,
          stock: product.quantity,
          category: product.category,
          batchNo: product.batchNo || '',
          hsn: product.hsn || '',
          gstRate: product.gstRate ?? null,
          unit: product.unit || 'PCS',
          manufacturingDate: product.manufacturingDate || product.mfgDate || null,
          expiryDate: product.expiryDate || null,
          barcode: product.barcode || '',
          image: product.image || product.imageUrl || null // Include image field
        }));
        
        // Set products first, then load images asynchronously
        setProducts(posProducts);
        
        // AUTOMATIC IMAGE LOADING DISABLED - Use manual upload only
        console.log('📁 Automatic image loading disabled. Products loaded without images.');

        // Handle empty product database
        if (firebaseProducts.length === 0) {
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

    loadProducts();
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
    let filtered = products;

    // Filter by category first
    if (selectedCategory !== 'All Items') {
      filtered = filtered.filter(product => {
        const productCategory = (product.category || '').toLowerCase().trim();
        const selectedCat = selectedCategory.toLowerCase().trim();

        // Exact match first
        if (productCategory === selectedCat) {
          return true;
        }

        // For broader categories, check if product category contains the selected category
        if (selectedCat === 'fertilizer' && productCategory.includes('fertilizer')) {
          return true;
        }

        // For specific matches
        return productCategory.includes(selectedCat);
      });
    }

    // Then filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, products, selectedCategory]);

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

  // Enhanced calculation functions
  const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);

  const calculateDiscount = () => {
    if (discountType === 'percentage') {
      return (subtotal * discount) / 100;
    } else {
      return Math.min(discount, subtotal); // Amount discount can't exceed subtotal
    }
  };

  const discountAmount = calculateDiscount();
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * tax) / 100;
  const total = taxableAmount + taxAmount;

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
      // Prepare sale data
      const saleData = {
        id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        billNumber: currentBillNumber,
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          hsn: item.hsn || '',
          gstRate: item.gstRate || 5
        })),
        customer: selectedCustomer || {
          name: customerForm.name || 'Walk-in Customer',
          phone: customerForm.phone || '',
          address: customerForm.address || ''
        },
        subtotal,
        discount: discountAmount,
        discountType,
        discountReason,
        tax: taxAmount,
        total,
        paymentMethod: paymentData.method,
        paymentStatus: 'completed',
        notes,
        timestamp: new Date(),
        createdBy: 'POS_USER',
        shopDetails
      };

      // Try to save to Firebase first
      let savedToFirebase = false;
      try {
        if (navigator.onLine) {
          await salesService.create(saleData);
          savedToFirebase = true;
          console.log('Sale saved to Firebase successfully');
        }
      } catch (firebaseError) {
        console.warn('Failed to save to Firebase, will store offline:', firebaseError);
      }

      // If Firebase failed or offline, store in IndexedDB
      if (!savedToFirebase) {
        try {
          await offlineStorage.addOfflineSale(saleData);
          console.log('Sale stored offline successfully');

          // Show offline notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-yellow-500 text-white p-3 rounded-lg shadow-lg z-50';
          notification.textContent = '📱 Sale saved offline - will sync when online';
          document.body.appendChild(notification);

          setTimeout(() => {
            document.body.removeChild(notification);
          }, 5000);
        } catch (offlineError) {
          console.error('Failed to store sale offline:', offlineError);
          throw new Error('Failed to save sale both online and offline');
        }
      }

      // Update inventory quantities
      for (const item of cart) {
        try {
          const product = products.find(p => p.id === item.id);
          if (product) {
            const newQuantity = Math.max(0, product.quantity - item.quantity);

            if (navigator.onLine) {
              await productsService.update(product.id, { quantity: newQuantity });
            } else {
              // Store inventory update offline
              await offlineStorage.addOfflineInventoryUpdate({
                id: `inv_update_${Date.now()}_${item.id}`,
                productId: item.id,
                type: 'sale',
                quantityChange: -item.quantity,
                newQuantity,
                saleId: saleData.id,
                timestamp: new Date()
              });
            }
          }
        } catch (inventoryError) {
          console.warn('Failed to update inventory for product:', item.id, inventoryError);
        }
      }

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
            id: saleData.id,
            total: total,
            customerName: selectedCustomer?.name || customerForm.name || 'Walk-in Customer',
            itemCount: cart.length,
            timestamp: new Date()
          });
        }
      } catch (notificationError) {
        console.warn('Failed to send sales notification:', notificationError);
      }

    } catch (error) {
      console.error('Error in payment:', error);
      alert('Payment failed: ' + error.message);
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

  // Print receipt function
  const printReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank', 'width=794,height=1123');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Sales Invoice - ${currentBillNumber}</title>
            <style>
              /* Shared Styles (apply to both screen and print) */
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
              }

              #invoice {
                max-width: 210mm;
                margin: 0 auto;
                background: white;
                padding: 20px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                border: 2px solid #000 !important;
                box-sizing: border-box;
                min-height: 280mm;
              }

              /* Force table borders for both screen and print */
              #invoice table,
              #invoice th,
              #invoice td {
                border: 1px solid #000 !important;
                border-collapse: collapse !important;
              }

              .invoice-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #000 !important;
                padding-bottom: 10px;
                margin-bottom: 10px;
              }

              .company-details {
                text-align: center;
                flex: 1;
              }

              .company-details h2 {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
              }

              .invoice-meta {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                border-bottom: 1px solid #000 !important;
                padding-bottom: 10px;
              }

              .buyer-details {
                flex: 1;
                padding-right: 20px;
              }

              .invoice-details {
                width: 200px;
                text-align: right;
              }

              .invoice-table {
                width: 100%;
                border-collapse: collapse !important;
                margin: 10px 0;
                font-size: 10px;
              }

              .invoice-table th,
              .invoice-table td {
                border: 1px solid #000 !important;
                padding: 4px;
                text-align: left;
                vertical-align: top;
              }

              .invoice-table th {
                font-weight: bold;
                text-align: center;
                background-color: #f5f5f5 !important;
              }

              .totals {
                margin: 10px 0;
                text-align: right;
                border-top: 1px solid #000 !important;
                padding-top: 10px;
              }

              .invoice-footer {
                margin-top: 15px;
                border-top: 1px solid #000 !important;
                padding-top: 10px;
                font-size: 10px;
              }

              .terms-section {
                margin-top: 10px;
              }

              .signatures {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
                padding-top: 10px;
              }

              /* Print-specific styles */
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 10mm;
                }

                body {
                  font-size: 12px;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  margin: 0;
                  padding: 0;
                  background: white;
                }

                #invoice {
                  width: 100%;
                  max-width: 210mm;
                  margin: auto;
                  background: white;
                  padding: 10px;
                  box-shadow: none;
                  min-height: 280mm;
                }
                /* Hide UI elements in print */
                .sidebar, .navbar, .app-header, .no-print {
                  display: none !important;
                }

                /* Ensure borders are visible in print */
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }

                #invoice * {
                  box-sizing: border-box !important;
                }
              }
              .text-center { text-align: center !important; }
              .text-right { text-align: right !important; }
              .text-left { text-align: left !important; }
              .font-bold { font-weight: bold !important; }
              .font-medium { font-weight: 500 !important; }
              .border-t { border-top: 1px solid #000 !important; }
              .border-b { border-bottom: 1px solid #000 !important; }
              .border-r { border-right: 1px solid #000 !important; }
              .border-l { border-left: 1px solid #000 !important; }
              .border { border: 1px solid #000 !important; }
              .border-2 { border: 2px solid #000 !important; }
              .border-black { border-color: #000 !important; }
              .border-2.border-black { border: 2px solid #000 !important; }
              .p-1 { padding: 2px 4px !important; }
              .p-2 { padding: 4px 8px !important; }
              .px-1 { padding-left: 4px !important; padding-right: 4px !important; }
              .py-0\\.5 { padding-top: 1px !important; padding-bottom: 1px !important; }
              .mb-1 { margin-bottom: 4px !important; }
              .mb-2 { margin-bottom: 8px !important; }
              .mb-3 { margin-bottom: 12px !important; }
              .mb-4 { margin-bottom: 16px !important; }
              .mb-6 { margin-bottom: 24px !important; }
              .pt-2 { padding-top: 8px !important; }
              .pt-0\\.5 { padding-top: 1px !important; }
              .space-y-0\\.5 > * + * { margin-top: 2px !important; }
              .space-y-1 > * + * { margin-top: 4px !important; }
              .flex { display: flex !important; }
              .justify-between { justify-content: space-between !important; }
              .items-center { align-items: center !important; }
              .grid { display: grid !important; }
              .grid-cols-3 { grid-template-columns: repeat(3, 1fr) !important; }
              .gap-2 { gap: 8px !important; }
              .bg-gray-50 { background-color: #f9fafb !important; }
              .text-gray-600 { color: #4b5563 !important; }
              .text-xs { font-size: 8px !important; }
              .text-sm { font-size: 9px !important; }
              .text-base { font-size: 12px !important; }
              .text-lg { font-size: 14px !important; }
              .text-xl { font-size: 16px !important; }
              .text-2xl { font-size: 20px !important; }
              .w-16 { width: 64px !important; }
              .w-20 { width: 80px !important; }
              .flex-1 { flex: 1 !important; }
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 8mm;
                }
                html, body {
                  width: 100%;
                  height: 100%;
                  margin: 0;
                  padding: 0;
                  font-size: 10px;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .receipt-content {
                  width: 100% !important;
                  max-width: 194mm !important; /* A4 width minus margins */
                  margin: 0 auto !important;
                  padding: 0 !important;
                  page-break-inside: avoid;
                }
                .no-print { display: none !important; }
                table {
                  page-break-inside: avoid;
                  width: 100% !important;
                  border-collapse: collapse !important;
                }
                tr { page-break-inside: avoid; }
                th, td {
                  font-size: 9px !important;
                  padding: 3px 4px !important;
                  border: 1px solid #000 !important;
                }
                .border-2 { border: 2px solid #000 !important; }
                /* Hide any UI elements that shouldn't print */
                button, .dialog-header, .dialog-footer { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div style="width: 100%; height: 100%; padding: 0; margin: 0;">
              <div id="invoice">
              <header class="invoice-header">
                <div class="gstin-info">
                  <strong>GSTIN: ${shopDetails?.gstNumber || '27AAAAA0000A1Z5'}</strong>
                </div>
                <div class="company-details">
                  <h2>${shopDetails?.name || 'KrishiSethu Fertilizers'}</h2>
                  <p>${shopDetails?.address || '123 Agricultural Complex, Mumbai, Maharashtra - 400001'}</p>
                  <p>Mobile: ${shopDetails?.phone || '+91-9876543210'} | Email: ${shopDetails?.email || 'info@krishisethu.com'}</p>
                  <p>PAN No: ${shopDetails?.panNumber || 'AAAAA0000A'} | FSSAI Lic No: ${shopDetails?.fssaiNumber || 'RWMKTRP'}</p>
                </div>
                <div class="invoice-type">
                  <strong>SALES INVOICE</strong><br>
                  <strong>Original For Buyer</strong>
                </div>
              </header>

              <section class="invoice-meta">
                <div class="buyer-details">
                  <p><strong>Buyer's Name and Address</strong></p>
                  <p><strong>${selectedCustomer?.name || customerForm.name || 'Walk-in Customer'}</strong></p>
                  ${(selectedCustomer?.address || customerForm.address) ? `<p>${selectedCustomer?.address || customerForm.address}</p>` : ''}
                  <p>Contact No.: ${selectedCustomer?.phone || customerForm.phone || 'N/A'}</p>
                  <p>GSTIN: ${selectedCustomer?.gstNumber || customerForm.gstNumber || 'N/A'}</p>
                </div>
                <div class="invoice-details">
                  <p><strong>Invoice No.:</strong> ${currentBillNumber}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
                  <p><strong>LR Reference No.:</strong> 123456</p>
                  <p><strong>Narration:</strong> ${paymentData.method?.toUpperCase() || 'CASH'}</p>
                </div>
              </section>

              <table class="invoice-table">
                <thead>
                  <tr>
                    <th style="width: 30px;">Sr.</th>
                    <th style="width: 200px;">Product, Name & Rate</th>
                    <th style="width: 80px;">HSN Code</th>
                    <th style="width: 70px;">Basic Price</th>
                    <th style="width: 60px;">CGST Rs. CGST %</th>
                    <th style="width: 60px;">SGST Rs. SGST %</th>
                    <th style="width: 60px;">IGST Rs. IGST %</th>
                    <th style="width: 70px;">Sales Price</th>
                    <th style="width: 40px;">Qty</th>
                    <th style="width: 40px;">Unit</th>
                    <th style="width: 80px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${cart.map((item, index) => {
                    const itemTotal = (item.price || 0) * item.quantity;
                    const gstRate = item.gstRate || 18;
                    const basicPrice = itemTotal / (1 + gstRate / 100);
                    const gstAmount = itemTotal - basicPrice;
                    const cgstAmount = gstAmount / 2;
                    const sgstAmount = gstAmount / 2;

                    return `
                      <tr>
                        <td style="text-align: center;">${index + 1}</td>
                        <td>
                          <div style="font-weight: bold;">${item.name}</div>
                          <div style="font-size: 8px; color: #666;">Batch Exp: abc123456 10-2022</div>
                        </td>
                        <td style="text-align: center;">${item.hsnCode || '31052000'}</td>
                        <td style="text-align: right;">₹${basicPrice.toFixed(2)}</td>
                        <td style="text-align: center;">
                          ₹${cgstAmount.toFixed(2)}<br>
                          ${(gstRate/2).toFixed(1)}%
                        </td>
                        <td style="text-align: center;">
                          ₹${sgstAmount.toFixed(2)}<br>
                          ${(gstRate/2).toFixed(1)}%
                        </td>
                        <td style="text-align: center;">
                          ₹0.00<br>
                          0.0%
                        </td>
                        <td style="text-align: right;">₹${(item.price || 0).toFixed(2)}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: center;">Bag</td>
                        <td style="text-align: right;">₹${itemTotal.toFixed(2)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>

              <section class="totals">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="border: 1px solid #000; padding: 4px; width: 15%;">
                      <strong>GST %</strong><br>
                      18%
                    </td>
                    <td style="border: 1px solid #000; padding: 4px; width: 15%;">
                      <strong>Taxable Amt</strong><br>
                      ₹${(subtotal / 1.18).toFixed(2)}
                    </td>
                    <td style="border: 1px solid #000; padding: 4px; width: 15%;">
                      <strong>SGST Amt.</strong><br>
                      ₹${((subtotal - (subtotal / 1.18)) / 2).toFixed(2)}
                    </td>
                    <td style="border: 1px solid #000; padding: 4px; width: 15%;">
                      <strong>CGST Amt.</strong><br>
                      ₹${((subtotal - (subtotal / 1.18)) / 2).toFixed(2)}
                    </td>
                    <td style="border: 1px solid #000; padding: 4px; width: 15%;">
                      <strong>Tax Amt.</strong><br>
                      ₹${(subtotal - (subtotal / 1.18)).toFixed(2)}
                    </td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25%;">
                      <strong>Total Amount Bef ore Tax</strong><br>
                      Add: SGST ₹${((subtotal - (subtotal / 1.18)) / 2).toFixed(2)}<br>
                      Add: CGST ₹${((subtotal - (subtotal / 1.18)) / 2).toFixed(2)}<br>
                      Add: IGST ₹0.00<br>
                      <strong>Total Tax Amount : GST ₹${(subtotal - (subtotal / 1.18)).toFixed(2)}</strong><br>
                      (-) Round Off ₹${(Math.round(total) - total).toFixed(2)}
                    </td>
                  </tr>
                </table>

                <div style="text-align: right; margin-top: 10px; border: 2px solid #000; padding: 10px;">
                  <p style="font-size: 14px;"><strong>GRAND TOTAL: ₹${Math.round(total).toFixed(2)}</strong></p>
                  <p style="font-size: 10px; margin-top: 5px;">For KrishiSethu Fertilizers</p>
                </div>
              </section>

              <footer class="invoice-footer">
                <div style="display: flex; justify-content: space-between;">
                  <div style="width: 48%;">
                    <p><strong>Bank Name:</strong> ${shopDetails?.bankName || 'Punjab National Bank'}</p>
                    <p><strong>Ac No.:</strong> ${shopDetails?.accountNumber || '04050070000822'}</p>
                    <p><strong>IFSC Code:</strong> ${shopDetails?.ifscCode || 'PUNB0040500'} Br. ${shopDetails?.branchName || 'Circular Rd, Rewari.'}</p>
                    <p><strong>Bill Amount in Words:</strong> ${numberToWords(Math.round(total))} Only</p>
                  </div>
                  <div style="width: 48%; text-align: right;">
                    <p style="margin-top: 30px;"><strong>Auth. Signatory</strong></p>
                  </div>
                </div>

                <div class="terms-section">
                  <p><strong>Terms & Conditions:</strong></p>
                  <p>1) Goods once sold will not be taken back or exchanged</p>
                  <p>2) Cheque Bounce Charges Rs. 450</p>
                  <p>3) Subject to Vadodara Jurisdiction</p>
                </div>

                <div style="display: flex; justify-content: space-between; margin-top: 20px; border-top: 1px solid #000; padding-top: 10px;">
                  <div><strong>Amount Received:</strong> ₹${paymentData.amountReceived?.toFixed(2) || total.toFixed(2)}</div>
                  <div><strong>Change:</strong> ₹${Math.max(0, (paymentData.amountReceived || total) - total).toFixed(2)}</div>
                  <div><strong>Payment Method:</strong> ${paymentData.method?.toUpperCase() || 'CASH'}</div>
                </div>
              </footer>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();

      // Wait for content to load then print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
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

  // Start new sale
  const startNewSale = () => {
    setCart([]);
    setSelectedCustomer(null);
    setPaymentData({ method: 'cash', cardNumber: '', upiId: '' });
    setCurrentBillNumber(generateBillNumber());
    setCustomerForm({ name: '', phone: '', address: '' });
    setShowReceiptDialog(false);
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Barcode Scanner</DialogTitle>
                  <DialogDescription>
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
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Select Customer</DialogTitle>
                            <DialogDescription>
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
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>Enter customer details to create a new customer profile</DialogDescription>
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
              {['All Items', 'Chemical Fertilizer', 'Organic Fertilizer', 'Bio Fertilizer', 'Seeds', 'NPK Fertilizers'].map((category) => (
                <Button
                  key={category}
                  variant={category === selectedCategory ? 'default' : 'outline'}
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
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
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Apply Discount</DialogTitle>
                              <DialogDescription>
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
                      <span>Tax ({tax}%):</span>
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
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>💳 Payment</DialogTitle>
                          <DialogDescription>
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🧾 Payment Receipt
              <Badge variant="outline" className="ml-auto">#{currentBillNumber}</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {/* Receipt Content - Professional Invoice Format */}
            <div ref={receiptRef} className="receipt-content bg-white p-2" style={{
              fontFamily: 'Arial, sans-serif',
              width: '194mm', // A4 width minus margins
              minHeight: '277mm', // A4 height minus margins
              maxWidth: '194mm',
              fontSize: '10px',
              lineHeight: '1.3',
              margin: '0 auto',
              overflow: 'visible',
              border: '1px solid #ddd'
            }}>

              {/* Complete Invoice with Border */}
              <div className="border-2 border-black" style={{ height: '100%', width: '100%' }}>
                {/* Top Header with GSTIN and Invoice Type */}
                <div className="border-b border-black p-1 flex justify-between items-center text-xs">
                  <span><strong>GSTIN: {shopDetails?.gstNumber || '27AAAAA0000A1Z5'}</strong></span>
                  <span><strong>SALES INVOICE</strong></span>
                  <span><strong>Original For Buyer</strong></span>
                </div>

                {/* Company Name and Details */}
                <div className="text-center p-2 border-b border-black">
                  <h2 className="text-base font-bold mb-1">{shopDetails?.name || 'KrishiSethu Fertilizers'}</h2>
                  <p className="text-xs mb-1">
                    {shopDetails?.address && typeof shopDetails.address === 'object' ?
                      `${shopDetails.address.street || ''}, ${shopDetails.address.city || ''}, ${shopDetails.address.state || ''} - ${shopDetails.address.pincode || ''}`.replace(/^,\s*|,\s*$/, '').replace(/,\s*,/g, ',')
                      : shopDetails?.address || 'A/12, Shrenik Park, Opp. Jain Temple, Near Akota Stadium, Akota Dandia Bazar, Vadodara, Gujarat'
                    }
                  </p>
                  <p className="text-xs">
                    Mobile: {shopDetails?.phone || '+91-9876543210'} | Email: {shopDetails?.email || 'info@krishisethu.com'}
                  </p>
                  <p className="text-xs">
                    FLZ Lic No.: RWA/147F, Seed Lic No.: RWA/203RS, Pesticide Lic No.: RWA/47RP
                  </p>
                </div>

                {/* Buyer Details and Invoice Info */}
                <div className="flex border-b border-black">
                  {/* Left - Buyer Details */}
                  <div className="flex-1 p-1 border-r border-black">
                    <p className="text-xs font-bold mb-1">Buyer's Name and Address</p>
                    <p className="text-xs font-semibold">{selectedCustomer?.name || customerForm.name || 'Walk-in Customer'}</p>
                    {(selectedCustomer?.address || customerForm.address) && (
                      <p className="text-xs">{selectedCustomer?.address || customerForm.address}</p>
                    )}
                    <p className="text-xs">Contact No.: {selectedCustomer?.phone || customerForm.phone || 'N/A'}</p>
                    <p className="text-xs">GSTIN: {selectedCustomer?.gstNumber || customerForm.gstNumber || 'N/A'}</p>
                  </div>

                  {/* Right - Invoice Details */}
                  <div className="w-40 p-1">
                    <div className="text-xs space-y-0.5">
                      <div className="flex justify-between">
                        <span>Invoice No.:</span>
                        <span>{currentBillNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date().toLocaleDateString('en-GB')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LR Reference No:</span>
                        <span>123456</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Narration:</span>
                        <span>{paymentData.method?.toUpperCase() || 'CASH'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
                  <thead>
                    <tr>
                      <th className="border border-black px-1 py-0.5 text-center" style={{ width: '25px' }}>Sr.</th>
                      <th className="border border-black px-1 py-0.5 text-left" style={{ width: '180px' }}>Product, Name & Rate</th>
                      <th className="border border-black px-1 py-0.5 text-center" style={{ width: '60px' }}>HSN Code</th>
                      <th className="border border-black px-1 py-0.5 text-center" style={{ width: '60px' }}>Basic Price</th>
                      <th className="border border-black px-1 py-0.5 text-center" style={{ width: '60px' }}>CGST Rs. CGST %</th>
                      <th className="border border-black px-1 py-0.5 text-center" style={{ width: '60px' }}>SGST Rs. SGST %</th>
                      <th className="border border-black px-1 py-0.5 text-center" style={{ width: '60px' }}>IGST Rs. IGST %</th>
                      <th className="border border-black px-1 py-0.5 text-center" style={{ width: '60px' }}>Sales Price</th>
                      <th className="border border-black px-1 py-0.5 text-center" style={{ width: '35px' }}>Qty</th>
                      <th className="border border-black px-1 py-0.5 text-center" style={{ width: '35px' }}>Unit</th>
                      <th className="border border-black px-1 py-0.5 text-center" style={{ width: '60px' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, index) => {
                      const itemTotal = item.price * item.quantity;
                      const gstRate = item.gstRate || 5;
                      const basicPrice = itemTotal / (1 + gstRate / 100);
                      const gstAmount = itemTotal - basicPrice;
                      const cgstAmount = gstAmount / 2;
                      const sgstAmount = gstAmount / 2;

                      return (
                        <tr key={index}>
                          <td className="border border-black px-1 py-0.5 text-center">{index + 1}</td>
                          <td className="border border-black px-1 py-0.5">
                            <div className="font-medium">{item.name}</div>
                            <div style={{ fontSize: '8px' }} className="text-gray-600">Batch Exp: abc123456 10-2022</div>
                          </td>
                          <td className="border border-black px-1 py-0.5 text-center">{item.hsn || '31051000'}</td>
                          <td className="border border-black px-1 py-0.5 text-center">
                            <div>{basicPrice.toFixed(2)}</div>
                            <div style={{ fontSize: '8px' }}>{(gstRate/2).toFixed(1)}%</div>
                          </td>
                          <td className="border border-black px-1 py-0.5 text-center">
                            <div>{cgstAmount.toFixed(2)}</div>
                            <div style={{ fontSize: '8px' }}>{(gstRate/2).toFixed(1)}%</div>
                          </td>
                          <td className="border border-black px-1 py-0.5 text-center">
                            <div>{sgstAmount.toFixed(2)}</div>
                            <div style={{ fontSize: '8px' }}>{(gstRate/2).toFixed(1)}%</div>
                          </td>
                          <td className="border border-black px-1 py-0.5 text-center">
                            <div>0.00</div>
                            <div style={{ fontSize: '8px' }}>0.00%</div>
                          </td>
                          <td className="border border-black px-1 py-0.5 text-center">{item.price.toFixed(2)}</td>
                          <td className="border border-black px-1 py-0.5 text-center">{item.quantity}</td>
                          <td className="border border-black px-1 py-0.5 text-center">Bag</td>
                          <td className="border border-black px-1 py-0.5 text-center font-medium">{itemTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}

                    {/* Empty rows for spacing */}
                    {Array.from({ length: Math.max(0, 4 - cart.length) }).map((_, index) => (
                      <tr key={`empty-${index}`} style={{ height: '20px' }}>
                        <td className="border border-black px-1 py-0.5"></td>
                        <td className="border border-black px-1 py-0.5"></td>
                        <td className="border border-black px-1 py-0.5"></td>
                        <td className="border border-black px-1 py-0.5"></td>
                        <td className="border border-black px-1 py-0.5"></td>
                        <td className="border border-black px-1 py-0.5"></td>
                        <td className="border border-black px-1 py-0.5"></td>
                        <td className="border border-black px-1 py-0.5"></td>
                        <td className="border border-black px-1 py-0.5"></td>
                        <td className="border border-black px-1 py-0.5"></td>
                        <td className="border border-black px-1 py-0.5"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Tax Summary */}
                <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1 w-16 text-center"><strong>GST %</strong><br/>5%</td>
                      <td className="border border-black p-1 w-20 text-center"><strong>Taxable Amt</strong><br/>{(subtotal - discountAmount).toFixed(2)}</td>
                      <td className="border border-black p-1 w-20 text-center"><strong>SGST Amt.</strong><br/>{(taxAmount/2).toFixed(2)}</td>
                      <td className="border border-black p-1 w-20 text-center"><strong>CGST Amt.</strong><br/>{(taxAmount/2).toFixed(2)}</td>
                      <td className="border border-black p-1 w-20 text-center"><strong>Tax Amt.</strong><br/>{taxAmount.toFixed(2)}</td>
                      <td className="border border-black p-1">
                        <div className="space-y-0.5">
                          <div className="flex justify-between">
                            <span>Total Amount Before Tax</span>
                            <span>{(subtotal - discountAmount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Add: SGST</span>
                            <span>{(taxAmount/2).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Add: CGST</span>
                            <span>{(taxAmount/2).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Add: IGST</span>
                            <span>0.00</span>
                          </div>
                          <div className="flex justify-between border-t border-black pt-0.5">
                            <span><strong>Total Tax Amount : GST</strong></span>
                            <span><strong>{taxAmount.toFixed(2)}</strong></span>
                          </div>
                          <div className="flex justify-between">
                            <span>(-) Round Off</span>
                            <span>-0.31</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Bank Details and Grand Total */}
                <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1" style={{ width: '60%' }}>
                        <div className="space-y-1">
                          <p><strong>Bank Name:</strong> Punjab National Bank</p>
                          <p><strong>Ac No.:</strong> 0405008700008228</p>
                          <p><strong>IFSC Code:</strong> PUNB0040500 Br. Circular Rd, Rewari.</p>
                          <p><strong>Bill Amount in Words:</strong> {numberToWordsIndian(Math.round(total))} Only</p>
                        </div>
                      </td>
                      <td className="border border-black p-1 text-center" style={{ width: '40%' }}>
                        <div className="text-sm font-bold mb-1">GRAND TOTAL</div>
                        <div className="text-xl font-bold mb-2">{total.toFixed(2)}</div>
                        <div style={{ fontSize: '8px' }} className="mb-3">For {shopDetails?.name || 'KrishiSethu Fertilizers'}</div>
                        <div style={{ fontSize: '8px' }} className="border-t border-black pt-2">Auth. Signatory</div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Terms and Conditions */}
                <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1">
                        <p><strong>Terms & Conditions:</strong></p>
                        <p>1) Goods once sold will not be taken back or exchanged</p>
                        <p>2) Cheque Bounce Charges Rs. 450</p>
                        <p>3) Subject to Vadodara Jurisdiction</p>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Payment Log Section */}
                <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1 bg-gray-50">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p><strong>Amount Received:</strong></p>
                            <p className="text-sm font-bold">₹{paymentData.amountReceived?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div>
                            <p><strong>Change:</strong></p>
                            <p className="text-sm font-bold">₹{Math.max(0, (paymentData.amountReceived || 0) - total).toFixed(2)}</p>
                          </div>
                          <div>
                            <p><strong>Payment Method:</strong></p>
                            <p className="text-sm font-bold">{paymentData.method?.toUpperCase() || 'CASH'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={printReceipt}>
              🖨️ Print Receipt
            </Button>
            <Button onClick={startNewSale} className="bg-green-600 hover:bg-green-700">
              🔁 New Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Image Upload Dialog */}
      <Dialog open={showImageUploadDialog} onOpenChange={setShowImageUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Product Images
            </DialogTitle>
            <DialogDescription>
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
