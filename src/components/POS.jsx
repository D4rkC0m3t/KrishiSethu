import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { customersService, salesService, productsService } from '../lib/firestore';
import { shopDetailsService } from '../lib/shopDetails';
import { imageService } from '../lib/imageService';
import { barcodeService } from '../lib/barcodeService';
import { thermalPrintService } from '../lib/thermalPrintService';
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
    upiId: ''
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
        setShopDetails(details);
      } catch (error) {
        console.error('Failed to load shop details:', error);
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

        // If no products, use mock data for demo
        if (firebaseProducts.length === 0) {
          const mockProducts = [
      {
        id: '1',
        name: 'Urea 50kg Bag',
        brand: 'IFFCO',
        price: 450,
        stock: 25,
        category: 'Nitrogen',
        hsn: '31021000',
        unit: 'BAG',
        gstRate: 5
      },
      {
        id: '2',
        name: 'DAP 50kg Bag',
        brand: 'Coromandel',
        price: 1500,
        stock: 15,
        category: 'Phosphorus',
        hsn: '31054000',
        unit: 'BAG',
        gstRate: 5
      },
      {
        id: '3',
        name: 'NPK 20-20-20 50kg',
        brand: 'Tata Chemicals',
        price: 950,
        stock: 30,
        category: 'Compound',
        hsn: '31052000',
        unit: 'BAG',
        gstRate: 5
      },
      {
        id: '4',
        name: 'Potash 50kg Bag',
        brand: 'ICL',
        price: 800,
        stock: 20,
        category: 'Potassium',
        hsn: '31042000',
        unit: 'BAG',
        gstRate: 5
      },
      {
        id: '5',
        name: 'Organic Compost 25kg',
        brand: 'Green Gold',
        price: 200,
        stock: 50,
        category: 'Organic',
        hsn: '31010000',
        unit: 'BAG',
        gstRate: 5
      },
      {
        id: '6',
        name: 'Zinc Sulphate',
        brand: 'Tata Chemicals',
        price: 220,
        stock: 35,
        category: 'Micronutrient',
        hsn: 'N/A',
        unit: 'kg',
        gstRate: 5
      }
    ];
          setProducts(mockProducts);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to mock data on error
        const mockProducts = [
          {
            id: '1',
            name: 'Urea 50kg Bag',
            brand: 'IFFCO',
            price: 450,
            stock: 25,
            category: 'Nitrogen'
          }
        ];
        setProducts(mockProducts);
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
      // Use mock customers for demo
      const mockCustomers = [
        {
          id: '1',
          name: 'Rajesh Farmer',
          phone: '+91-9876543210',
          email: 'rajesh@example.com',
          address: 'Village Kharadi, Pune',
          city: 'Pune',
          pincode: '411014',
          gstNumber: '',
          creditLimit: 50000,
          currentCredit: 15000,
          totalPurchases: 125000,
          status: 'VIP'
        },
        {
          id: '2',
          name: 'Sunita Agro Dealer',
          phone: '+91-9876543211',
          email: 'sunita@agrostore.com',
          address: 'Shop 15, Market Yard',
          city: 'Mumbai',
          pincode: '400001',
          gstNumber: '27AAAAA0000A1Z5',
          creditLimit: 100000,
          currentCredit: 25000,
          totalPurchases: 350000,
          status: 'VIP'
        }
      ];
      setCustomers(mockCustomers);
    }
  };

  // Filter products based on search
  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

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

  // Enhanced calculation functions
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
      const result = await barcodeService.findProductByBarcode(barcode, products);

      if (result.success) {
        addToCart(result.product);
        alert(`Product added: ${result.product.name}`);
        setShowBarcodeScanner(false);
      } else {
        alert(`Product not found for barcode: ${barcode}`);
      }
    } catch (error) {
      console.error('Error handling barcode scan:', error);
      alert('Error processing barcode');
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
    // Filter products by category if needed
  };


  // Enhanced sale completion
  const completeSale = async () => {
    console.log('completeSale function called');
    alert('Payment processing started!'); // Immediate feedback

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
      // Simple test - just show receipt without Firebase
      console.log('Simulating payment processing...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Close payment dialog and show receipt
      setShowPaymentDialog(false);
      setShowReceiptDialog(true);

      console.log('Payment completed successfully!');
      alert('Payment completed! Receipt will be shown.');

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

  const startBarcodeScanning = async () => {
    setIsScanning(true);
    try {
      // Subscribe to barcode scans
      const unsubscribe = barcodeService.subscribe(handleBarcodeScan);

      // Check camera support
      const cameraSupport = await barcodeService.checkCameraSupport();
      if (!cameraSupport.supported) {
        alert('Camera not supported on this device');
        setIsScanning(false);
        return;
      }

      // For demo, simulate barcode scan after 2 seconds
      setTimeout(() => {
        setIsScanning(false);
        setBarcodeInput('1'); // Simulate scanned barcode
        handleBarcodeSearch();
        unsubscribe();
      }, 2000);
    } catch (error) {
      console.error('Error starting barcode scan:', error);
      setIsScanning(false);
      alert('Error starting camera scan');
    }
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
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${currentBillNumber}</title>
            <style>
              body { font-family: monospace; margin: 20px; }
              .receipt { max-width: 300px; margin: 0 auto; }
              .center { text-align: center; }
              .line { border-bottom: 1px dashed #000; margin: 10px 0; }
              .total { font-weight: bold; font-size: 1.2em; }
            </style>
          </head>
          <body>
            ${receiptRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-card shadow-sm border-b p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
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
            <div className="flex items-center gap-2 text-sm text-gray-600">
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
                      onClick={startBarcodeScanning}
                      disabled={isScanning}
                      className="w-full"
                    >
                      {isScanning ? (
                        <>
                          <Camera className="h-4 w-4 mr-2 animate-pulse" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4 mr-2" />
                          Start Camera Scan
                        </>
                      )}
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
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
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
              {['All Items', 'Fertilizers', 'Seeds', 'Pesticides', 'Organic'].map((category) => (
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
                            const fallbackDiv = e.target.parentElement.querySelector('.fallback-icon');
                            if (fallbackDiv) {
                              fallbackDiv.style.display = 'flex';
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
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No products found</p>
                <p className="text-sm text-gray-400">Try adjusting your search terms</p>
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
                      <PaymentDialog
                        total={total}
                        paymentData={paymentData}
                        setPaymentData={setPaymentData}
                        onComplete={completeSale}
                        isProcessing={isProcessing}
                      />
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
      <ReceiptDialog
        open={showReceiptDialog}
        onOpenChange={setShowReceiptDialog}
        cart={cart}
        customer={selectedCustomer}
        payment={paymentData}
        totals={{ subtotal, discount: discountAmount, tax: taxAmount, total }}
        billNumber={currentBillNumber}
        shopDetails={shopDetails}
        onNewSale={startNewSale}
      />

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
    </div>
  );
};

// Payment Dialog Component
const PaymentDialog = ({ total, paymentData, setPaymentData, onComplete, isProcessing }) => {

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>💳 Payment</DialogTitle>
        <DialogDescription>
          Complete the payment for this sale
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="text-center">
          <p className="text-2xl font-bold">Total: ₹{total.toFixed(2)}</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Method</label>
          <Select
            value={paymentData.method}
            onValueChange={(value) => setPaymentData(prev => ({ ...prev, method: value }))}
            disabled={isProcessing}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">💵 Cash</SelectItem>
              <SelectItem value="card">💳 Card</SelectItem>
              <SelectItem value="upi">📱 UPI</SelectItem>
              <SelectItem value="credit">📝 Credit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isProcessing && (
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-blue-600">Processing payment...</p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" disabled={isProcessing}>
          Back
        </Button>
        <Button
          onClick={() => {
            console.log('Complete Payment button clicked!');
            onComplete();
          }}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Processing...
            </>
          ) : (
            'Complete Payment ✅'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

// Receipt Dialog Component
const ReceiptDialog = ({ open, onOpenChange, cart, customer, payment, totals, onNewSale, billNumber, shopDetails }) => {
  const currentDate = new Date();
  const receiptRef = useRef();

  // Handle thermal printing
  const handleThermalPrint = async () => {
    try {
      const receiptData = {
        shopDetails,
        billNumber,
        customer,
        items: cart,
        totals,
        payment,
        date: currentDate
      };

      const result = await thermalPrintService.printReceipt(receiptData);

      if (result.success) {
        alert('Receipt sent to thermal printer!');
      } else {
        alert(`Print error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error printing thermal receipt:', error);
      alert('Error printing receipt');
    }
  };

  // Handle regular printing
  const handlePrint = () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        alert('Please allow popups for printing');
        return;
      }

      // Get the receipt content
      const receiptContent = receiptRef.current;
      if (!receiptContent) {
        alert('Receipt content not found');
        return;
      }

      // Create the print document
      const printDocument = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${billNumber}</title>
          <style>
            @page { 
              size: A4 portrait; 
              margin: 10mm; 
            }
            
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              color: black;
              background: white;
              margin: 0;
              padding: 20px;
            }
            
            .receipt-container {
              max-width: 100%;
              margin: 0 auto;
              background: white;
              color: black;
            }
            
            .text-center { text-align: center; }
            .text-sm { font-size: 11px; }
            .text-xs { font-size: 10px; }
            .text-lg { font-size: 14px; }
            .font-bold { font-weight: bold; }
            .border-b { border-bottom: 1px solid black; }
            .border-b-2 { border-bottom: 2px solid black; }
            .border-t { border-top: 1px solid black; }
            .pb-1 { padding-bottom: 4px; }
            .pb-2 { padding-bottom: 8px; }
            .pb-3 { padding-bottom: 12px; }
            .pt-0\\.5 { padding-top: 2px; }
            .pt-1 { padding-top: 4px; }
            .pt-2 { padding-top: 8px; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-2 > * + * { margin-top: 8px; }
            .space-y-3 > * + * { margin-top: 12px; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
            .gap-1 { gap: 4px; }
            .gap-2 { gap: 8px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .text-gray-600 { color: #666; }
            
            /* Table styles */
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 8px 0;
            }
            th, td { 
              padding: 2px 4px; 
              text-align: left; 
              font-size: 10px;
            }
            th { 
              font-weight: bold; 
            }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .text-center { text-align: center; }
            
            /* Specific border classes used in the table */
            .border-b { border-bottom: 1px solid black !important; }
            .border-b-2 { border-bottom: 2px solid black !important; }
            .border-t { border-top: 1px solid black !important; }
            .border-r { border-right: 1px solid black !important; }
            .border-l { border-left: 1px solid black !important; }
            .border { border: 1px solid black !important; }
            .border-black { border-color: black !important; }
            
            /* Width classes */
            .w-8 { width: 2rem; }
            .w-12 { width: 3rem; }
            .w-16 { width: 4rem; }
            .w-20 { width: 5rem; }
            .w-full { width: 100%; }
            
            /* Padding classes */
            .px-1 { padding-left: 4px; padding-right: 4px; }
            .py-0\.5 { padding-top: 2px; padding-bottom: 2px; }
            
            /* Grid layout for non-table content */
            .grid-cols-2 { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 8px; 
            }
            .grid-cols-3 { 
              display: grid; 
              grid-template-columns: 1fr 1fr 1fr; 
              gap: 4px; 
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${receiptContent.innerHTML}
          </div>
        </body>
        </html>
      `;

      // Write the document and print
      printWindow.document.write(printDocument);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };

    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('Error printing receipt');
    }
  };

  // Local helper function to format address
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col bg-white text-black" style={{ backgroundColor: 'white', color: 'black' }}>
        <DialogHeader className="bg-white" style={{ backgroundColor: 'white' }}>
          <DialogTitle className="text-black" style={{ color: 'black' }}>🧾 Receipt</DialogTitle>
        </DialogHeader>

        <div className="flex-1 max-h-[70vh] overflow-y-auto receipt-scroll pr-3 bg-white" style={{ backgroundColor: 'white' }}>
          <div ref={receiptRef} id="printable-invoice" className="bg-white p-4 text-black space-y-3 text-sm font-mono border rounded" style={{ backgroundColor: 'white', color: 'black' }}>
          {/* Shop Header */}
          <div className="text-center border-b-2 border-black pb-3">
            {/* Logo and Shop Name */}
            <div className="flex items-center justify-center gap-3 mb-2">
              {shopDetails?.logo ? (
                <img
                  src={shopDetails.logo}
                  alt="Shop Logo"
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  VK
                </div>
              )}
              <h2 className="text-lg font-bold">{shopDetails?.name || 'VK FERTILIZERS'}</h2>
            </div>
            <p className="text-sm">{shopDetails ? formatAddress(shopDetails.address) : 'Siababa Temple Near Darga, Holagunda'}</p>
            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <p>Contact: {shopDetails?.phone || '8688765111'}</p>
              <p>GSTIN: {shopDetails?.gstNumber || '29ABCDE1234F1Z5'}</p>
            </div>
            <div className="grid grid-cols-3 gap-1 text-sm mt-2">
              <p>FLZ: {shopDetails?.fertilizerLicense || 'FL/2024/001'}</p>
              <p>Seed: {shopDetails?.seedLicense || 'SD/2024/001'}</p>
              <p>Pest: {shopDetails?.pesticideLicense || 'PS/2024/001'}</p>
            </div>
          </div>

          {/* Invoice Header */}
          <div className="text-center border-b pb-2">
            <h3 className="text-base font-bold">RETAIL INVOICE</h3>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4 border-b pb-2 text-sm">
            <div>
              <p><strong>Invoice:</strong> {billNumber}</p>
              <p><strong>Date:</strong> {currentDate.toLocaleDateString('en-IN')}</p>
            </div>
            <div className="text-right">
              <p><strong>Cashier:</strong> Admin</p>
              <p><strong>Buyer:</strong> {customer?.name || 'Walk-in Customer'}</p>
            </div>
          </div>
          
          {/* Items Table */}
          <div className="border-b pb-1">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left border-r border-black px-1 py-0.5 w-8">Sr</th>
                  <th className="text-left border-r border-black px-1 py-0.5">Description</th>
                  <th className="text-center border-r border-black px-1 py-0.5 w-16">HSN</th>
                  <th className="text-center border-r border-black px-1 py-0.5 w-12">GST%</th>
                  <th className="text-right border-r border-black px-1 py-0.5 w-16">Rate</th>
                  <th className="text-center border-r border-black px-1 py-0.5 w-12">Qty</th>
                  <th className="text-right px-1 py-0.5 w-20">Amount</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={item.id} className="border-b">
                    <td className="border-r border-black px-1 py-0.5">{index + 1}</td>
                    <td className="border-r border-black px-1 py-0.5">
                      <div className="font-medium">{item.name}</div>
                      {item.batchNo && <div className="text-xs text-gray-600">B:{item.batchNo}</div>}
                    </td>
                    <td className="text-center border-r border-black px-1 py-0.5">{item.hsn || '31051000'}</td>
                    <td className="text-center border-r border-black px-1 py-0.5">{item.gstRate || '5'}</td>
                    <td className="text-right border-r border-black px-1 py-0.5">₹{item.price.toFixed(2)}</td>
                    <td className="text-center border-r border-black px-1 py-0.5">{item.quantity}</td>
                    <td className="text-right px-1 py-0.5">₹{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Totals Section */}
          <div className="space-y-0.5 border-b pb-1 text-xs">
            <div className="flex justify-between">
              <span>Taxable Amt:</span>
              <span>₹{(totals.subtotal - totals.discount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST @5%:</span>
              <span>₹{totals.tax.toFixed(2)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-₹{totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t pt-0.5">
              <span>TOTAL:</span>
              <span>₹{totals.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Bank Details */}
          <div className="border-b pb-3">
            <p className="font-bold mb-1">Bank Details:</p>
            <div className="text-xs space-y-1">
              <p>Bank Name: {shopDetails?.bankName || 'State Bank of India'}</p>
              <p>A/C No: {shopDetails?.accountNumber || '12345678901234'} | IFSC: {shopDetails?.ifscCode || 'SBIN0001234'}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border-b pb-1 text-xs">
            <div className="flex justify-between">
              <span className="font-bold">Payment:</span>
              <span className="capitalize font-bold">{payment.method}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs pt-1">
            <p className="font-bold">Thank you for your purchase!</p>
            <p>Keep fertilizers in cool, dry place.</p>
            <p className="text-gray-600">Contact: {shopDetails?.phone || '8688765111'}</p>
          </div>
          </div>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t flex-shrink-0 bg-white" style={{ backgroundColor: 'white' }}>
          <Button variant="outline" onClick={handlePrint}>
            🖨️ Print Receipt
          </Button>
          <Button
            variant="outline"
            onClick={() => handleThermalPrint()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            🖨️ Thermal Print
          </Button>
          <Button onClick={onNewSale} className="bg-green-600 hover:bg-green-700">
            🔁 New Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>


  );
};

export default POS;
