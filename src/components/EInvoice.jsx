import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { customersService, productsService, einvoicesService, einvoiceItemsService, utilityService, customerBalanceService, settingsOperations } from '../lib/supabaseDb';
import { generateEInvoiceQRCode, generateEInvoiceQRData } from '../utils/qrCodeGenerator';
import InvoicePreview from './InvoicePreview';
import {
  FileText,
  Plus,
  Minus,
  Trash2,
  User,
  Package,
  Calculator,
  Search,
  Eye,
  Printer,
  Save,
  Send,
  Calendar,
  Hash,
  DollarSign,
  Percent,
  CheckCircle,
  AlertCircle,
  QrCode,
  Truck,
  Building,
  RefreshCw,
  Scan,
  Camera,
  BarChart3
} from 'lucide-react';

const EInvoice = ({ onNavigate }) => {
  // Invoice state
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerId: '',
    customerName: '',
    customerGSTIN: '',
    customerAddress: '',
    customerPhone: '',
    customerEmail: '',
    customerState: '',
    customerStateCode: '',
    customerContactPerson: '',
    // Consignee details (auto-filled from customer)
    consigneeName: '',
    consigneeGSTIN: '',
    consigneeAddress: '',
    consigneePhone: '',
    consigneeEmail: '',
    consigneeState: '',
    consigneeStateCode: '',
    consigneeContactPerson: '',
    placeOfSupply: '',
    despatchThrough: '',
    destination: '',
    ewaybillNo: '',
    ewaybillDate: '',
    vehicleNo: '',
    transporterId: '',
    otherRef: '',
    paymentMethod: 'cash',
    supplyDateTime: '',
    ackNo: '',
    ackDate: '',
    irn: '',
    notes: '',
    termsAndConditions: ''
  });

  // Items state
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    productName: '',
    description: '',
    hsn: '',
    quantity: 1,
    unit: 'PCS',
    rate: 0,
    mrp: 0,
    gstRate: 18,
    mfgDate: '',
    expDate: '',
    batchNo: '',
    discount: 0,
    discountType: 'percentage' // percentage or amount
  });

  // UI state
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [customerBalance, setCustomerBalance] = useState(null);
  const [outstandingAmount, setOutstandingAmount] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successAction, setSuccessAction] = useState(null);

  // Barcode scanning states
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Real-time customer outstanding
  const [customerOutstanding, setCustomerOutstanding] = useState(0);
  const [loadingOutstanding, setLoadingOutstanding] = useState(false);

  // Real-time QR code generation
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [generatingQR, setGeneratingQR] = useState(false);

  // Settings for invoice - loaded from database
  const [systemSettings, setSystemSettings] = useState({
    companyInfo: {
      name: 'Loading...',
      address: {
        street: '',
        city: '',
        district: '',
        state: '',
        pincode: ''
      },
      gstNumber: '',
      stateCode: '',
      phone: '',
      email: ''
    },
    bankDetails: {
      bankName: '',
      accountNumber: '',
      branch: '',
      ifsc: ''
    },
    taxSettings: {
      hsnCode: '38089199',
      igstRate: 18,
      cgstRate: 9,
      sgstRate: 9
    }
  });

  // Generate invoice number using utility service
  const generateInvoiceNumber = () => {
    return utilityService.generateEInvoiceNumber();
  };

  // Test services availability
  const testServices = async () => {
    try {
      // Test if services are available
      if (!customersService || !productsService || !einvoicesService || !customerBalanceService) {
        console.error('Some services are not available');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error testing services:', error);
      return false;
    }
  };

  // Load company details from database
  const loadCompanyDetails = async () => {
    try {
      console.log('🏢 Loading company details for E-Invoice...');
      const settings = await settingsOperations.getSystemSettings();
      console.log('✅ Company settings loaded for E-Invoice:', settings);

      if (settings && settings.companyInfo) {
        const companyInfo = settings.companyInfo;
        console.log('🏢 Company info found:', companyInfo);

        setSystemSettings(prev => ({
          ...prev,
          companyInfo: {
            name: companyInfo.name || 'Krishisethu',
            address: {
              street: companyInfo.address?.street || companyInfo.street || '',
              city: companyInfo.address?.city || companyInfo.city || '',
              district: companyInfo.address?.district || companyInfo.district || '',
              state: companyInfo.address?.state || companyInfo.state || '',
              pincode: companyInfo.address?.pincode || companyInfo.pincode || ''
            },
            gstNumber: companyInfo.gstNumber || companyInfo.gst_number || '',
            stateCode: companyInfo.stateCode || companyInfo.state_code || '',
            phone: companyInfo.phone || '',
            email: companyInfo.email || '',
            logo: companyInfo.logo || companyInfo.logo_url || null
          },
          bankDetails: {
            bankName: companyInfo.bankName || companyInfo.bank_name || '',
            accountNumber: companyInfo.accountNumber || companyInfo.account_number || '',
            branch: companyInfo.branch || '',
            ifsc: companyInfo.ifsc || companyInfo.ifsc_code || ''
          }
        }));

        console.log('✅ Company details updated in E-Invoice settings');
      } else {
        console.log('⚠️ No company info found in settings, using defaults');
      }
    } catch (error) {
      console.error('❌ Failed to load company details for E-Invoice:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      const servicesAvailable = await testServices();
      if (servicesAvailable) {
        loadCustomers();
        loadProducts();
        loadCompanyDetails(); // Load company details
        setInvoiceData(prev => ({
          ...prev,
          invoiceNumber: generateInvoiceNumber(),
          ackNo: utilityService.generateAckNo(),
          ackDate: new Date().toISOString().split('T')[0],
          irn: utilityService.generateIRN()
        }));
      } else {
        console.error('Services not available, component may not work properly');
      }
    };

    initializeComponent();
  }, []);

  // Load customers
  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const customerData = await customersService.getAll();
      setCustomers(customerData || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
      // Don't show alert for data loading errors, just log them
    } finally {
      setIsLoading(false);
    }
  };

  // Load products
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const productData = await productsService.getAll();
      setProducts(productData || []);
      setFilteredProducts(productData || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      setFilteredProducts([]);
      // Don't show alert for data loading errors, just log them
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.hsn?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Reload products when product dialog opens
  useEffect(() => {
    if (showProductDialog && products.length === 0) {
      console.log('Product dialog opened but no products loaded, reloading...');
      loadProducts();
    }
  }, [showProductDialog, products.length]);

  // Handle customer selection
  const handleCustomerSelect = async (customer) => {
    console.log('🔄 Customer selected for E-Invoice:', customer);

    // Format address properly - handle both string and object formats
    const formatAddress = (address) => {
      if (typeof address === 'object' && address) {
        return `${address.street || ''} ${address.city || ''} ${address.state || ''} ${address.pincode || ''}`.trim();
      }
      return address || '';
    };

    setInvoiceData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
      customerGSTIN: customer.gstin || '',
      customerAddress: formatAddress(customer.address),
      customerPhone: customer.phone || '',
      customerEmail: customer.email || '',
      customerState: customer.state || '',
      customerStateCode: customer.stateCode || '',
      customerContactPerson: customer.contactPerson || customer.name,
      placeOfSupply: customer.state || '',
      // Auto-fill consignee details with same customer info
      consigneeName: customer.name,
      consigneeGSTIN: customer.gstin || '',
      consigneeAddress: formatAddress(customer.address),
      consigneePhone: customer.phone || '',
      consigneeEmail: customer.email || '',
      consigneeState: customer.state || '',
      consigneeStateCode: customer.stateCode || '',
      consigneeContactPerson: customer.contactPerson || customer.name
    }));

    console.log('✅ Customer and consignee details auto-filled');

    // Load customer balance and outstanding amount with real-time updates
    await loadCustomerOutstanding(customer.id);

    setShowCustomerDialog(false);
  };

  // Load real-time customer outstanding balance
  const loadCustomerOutstanding = async (customerId) => {
    if (!customerId) {
      setCustomerBalance(null);
      setOutstandingAmount(0);
      setCustomerOutstanding(0);
      return;
    }

    try {
      setLoadingOutstanding(true);
      console.log('💰 Loading real-time customer outstanding balance...');

      // Get customer balance from the service
      const balance = await customerBalanceService.getBalance(customerId);
      setCustomerBalance(balance);
      setOutstandingAmount(balance?.outstandingAmount || 0);
      setCustomerOutstanding(balance?.outstanding_amount || balance?.outstandingAmount || 0);

      console.log('✅ Customer outstanding loaded:', balance);
    } catch (error) {
      console.error('❌ Error loading customer outstanding:', error);
      setCustomerBalance(null);
      setOutstandingAmount(0);
      // Don't show error to user for balance loading failure
      setCustomerOutstanding(0);
    } finally {
      setLoadingOutstanding(false);
    }
  };

  // Barcode scanning functionality
  const handleBarcodeSearch = async (barcode) => {
    if (!barcode.trim()) return;

    try {
      setIsScanning(true);
      console.log('🔍 Searching product by barcode:', barcode);

      // Search for product by barcode, code, or name
      const foundProducts = products.filter(product =>
        product.barcode === barcode ||
        product.code === barcode ||
        product.name.toLowerCase().includes(barcode.toLowerCase())
      );

      if (foundProducts.length > 0) {
        const product = foundProducts[0];
        console.log('✅ Product found by barcode:', product);

        // Add product to items
        const newItem = {
          id: Date.now(),
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          description: product.description || '',
          hsn: product.hsn_code || '38089199',
          quantity: 1,
          unit: product.unit || 'KGS',
          rate: product.sale_price || 0,
          mrp: product.mrp || 0,
          gstRate: product.gst_rate || 18,
          discount: 0,
          discountType: 'percentage',
          batchNo: product.batch_no || '',
          mfgDate: product.manufacturing_date || '',
          expDate: product.expiry_date || ''
        };

        setItems(prev => [...prev, newItem]);
        setBarcodeInput('');
        setShowBarcodeScanner(false);

        // Show success message
        alert(`✅ Product "${product.name}" added successfully!`);
      } else {
        alert(`❌ No product found with barcode: ${barcode}`);
      }
    } catch (error) {
      console.error('❌ Error searching by barcode:', error);
      alert('Error searching product by barcode');
    } finally {
      setIsScanning(false);
    }
  };

  // Handle barcode input (for manual entry or scanner input)
  const handleBarcodeInput = (e) => {
    const value = e.target.value;
    setBarcodeInput(value);

    // Auto-search when Enter is pressed or barcode is complete
    if (e.key === 'Enter' || value.length >= 8) {
      handleBarcodeSearch(value);
    }
  };

  // QR code generation function will be moved after totals calculation

  // Clear customer selection
  const clearCustomerSelection = () => {
    setInvoiceData(prev => ({
      ...prev,
      customerId: '',
      customerName: '',
      customerGSTIN: '',
      customerAddress: '',
      customerPhone: '',
      customerEmail: '',
      customerState: '',
      customerStateCode: '',
      customerContactPerson: '',
      placeOfSupply: ''
    }));
    setCustomerBalance(null);
    setOutstandingAmount(0);
  };

  // Handle product selection
  const handleProductSelect = (product) => {
    if (!product || !product.id) {
      console.error('Invalid product selected:', product);
      alert('Invalid product selected');
      return;
    }

    setCurrentItem(prev => ({
      ...prev,
      productId: product.id,
      productName: product.name || 'Unknown Product',
      description: product.description || product.name || 'No description',
      hsn: product.hsn || systemSettings.taxSettings.hsnCode,
      rate: product.sellingPrice || product.price || 0,
      mrp: product.mrp || product.sellingPrice || product.price || 0,
      gstRate: product.gstRate || systemSettings.taxSettings.igstRate,
      unit: product.unit || 'PCS'
    }));
    setShowProductDialog(false);
  };

  // Add item to invoice
  const addItem = () => {
    if (!currentItem.productId || !currentItem.productName || currentItem.quantity <= 0 || currentItem.rate <= 0) {
      alert('Please fill all required fields for the item');
      return;
    }

    const newItem = {
      ...currentItem,
      id: Date.now().toString(),
      amount: calculateItemAmount(currentItem)
    };

    setItems(prev => [...prev, newItem]);
    
    // Reset current item
    setCurrentItem({
      productId: '',
      productName: '',
      description: '',
      hsn: '',
      quantity: 1,
      unit: 'PCS',
      rate: 0,
      mrp: 0,
      gstRate: 18,
      mfgDate: '',
      expDate: '',
      batchNo: '',
      discount: 0,
      discountType: 'percentage'
    });
  };

  // Calculate item amount
  const calculateItemAmount = (item) => {
    const baseAmount = item.quantity * item.rate;
    let discountAmount = 0;
    
    if (item.discountType === 'percentage') {
      discountAmount = (baseAmount * item.discount) / 100;
    } else {
      discountAmount = item.discount;
    }
    
    return baseAmount - discountAmount;
  };

  // Remove item
  const removeItem = (itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
    const totalTax = items.reduce((sum, item) => {
      const itemAmount = calculateItemAmount(item);
      return sum + (itemAmount * item.gstRate) / 100;
    }, 0);
    const total = subtotal + totalTax;
    const roundOff = Math.round(total) - total;
    const grandTotal = Math.round(total);

    return {
      subtotal,
      totalTax,
      total,
      roundOff,
      grandTotal
    };
  };

  const totals = calculateTotals();

  // Generate real-time QR code based on current invoice data
  const generateRealTimeQRCode = async () => {
    try {
      setGeneratingQR(true);
      console.log('🔄 Generating real-time QR code...');

      // Prepare current invoice data for QR generation
      const currentInvoiceData = {
        invoice_number: invoiceData.invoiceNumber,
        irn: invoiceData.irn || null,
        ack_number: invoiceData.ackNo || null,
        ack_date: invoiceData.ackDate || null,
        seller_gstin: systemSettings.companyInfo.gstNumber || '29ABCDE1234F1Z5',
        buyer_gstin: invoiceData.customerGSTIN || '',
        invoice_date: invoiceData.invoiceDate,
        total_amount: totals.grandTotal,
        invoice_type: 'INV'
      };

      // Prepare current items data
      const currentItems = items.map(item => ({
        hsn_code: item.hsn || '38089199',
        hsn: item.hsn || '38089199'
      }));

      // Generate QR code
      const qrResult = await generateEInvoiceQRCode(currentInvoiceData, currentItems);

      setQrCodeData(qrResult.qrData);
      setQrCodeImage(qrResult.qrCodeImage);

      console.log('✅ Real-time QR code generated successfully');
      console.log('📊 QR Data:', qrResult.qrData);

    } catch (error) {
      console.error('❌ Error generating real-time QR code:', error);
      alert('Error generating QR code: ' + error.message);
    } finally {
      setGeneratingQR(false);
    }
  };

  // Auto-generate QR code when invoice data changes
  useEffect(() => {
    if (invoiceData.invoiceNumber && items.length > 0 && totals.grandTotal > 0) {
      const debounceTimer = setTimeout(() => {
        generateRealTimeQRCode();
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(debounceTimer);
    }
  }, [invoiceData.invoiceNumber, invoiceData.customerName, totals.grandTotal, items.length]);

  // Handle success dialog actions
  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    if (successAction) {
      successAction();
    }
  };

  const handleSuccessCancel = () => {
    setShowSuccessDialog(false);
    // Reset form for new invoice (only for generate action)
    if (successMessage.includes('generated successfully')) {
      setInvoiceData(prev => ({
        ...prev,
        invoiceNumber: generateInvoiceNumber(),
        customerId: '',
        customerName: '',
        customerGSTIN: '',
        customerAddress: '',
        customerPhone: '',
        customerEmail: '',
        customerState: '',
        customerStateCode: '',
        customerContactPerson: '',
        notes: ''
      }));
      setItems([]);
      setCustomerBalance(null);
      setOutstandingAmount(0);
    }
  };

  // Validate invoice data
  const validateInvoiceData = () => {
    const errors = [];

    if (!invoiceData.customerName.trim()) {
      errors.push('Customer name is required');
    }

    if (items.length === 0) {
      errors.push('At least one item is required');
    }

    if (!invoiceData.invoiceNumber.trim()) {
      errors.push('Invoice number is required');
    }

    if (!invoiceData.invoiceDate) {
      errors.push('Invoice date is required');
    }

    // Validate items
    items.forEach((item, index) => {
      if (!item.productName.trim()) {
        errors.push(`Item ${index + 1}: Product name is required`);
      }
      if (!item.hsn.trim()) {
        errors.push(`Item ${index + 1}: HSN code is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.rate <= 0) {
        errors.push(`Item ${index + 1}: Rate must be greater than 0`);
      }
    });

    return errors;
  };

  // Save E-Invoice as draft
  const saveDraft = async () => {
    try {
      setIsLoading(true);

      const validationErrors = validateInvoiceData();
      if (validationErrors.length > 0) {
        alert('Please fix the following errors:\n' + validationErrors.join('\n'));
        return;
      }

      // Create comprehensive E-invoice data for dedicated einvoices table
      const einvoiceData = {
        invoice_number: invoiceData.invoiceNumber,
        invoice_type: 'b2b', // Default to B2B
        status: 'draft',

        // Date fields
        invoice_date: invoiceData.invoiceDate,
        due_date: invoiceData.dueDate || null,
        supply_date_time: invoiceData.supplyDateTime ? new Date(invoiceData.supplyDateTime) : null,

        // Seller details (from system settings)
        seller_gstin: systemSettings.companyInfo.gstNumber || '29ABCDE1234F1Z5',
        seller_name: systemSettings.companyInfo.name || 'Krishisethu Agro Solutions',
        seller_address: systemSettings.companyInfo.address || {},
        seller_state_code: systemSettings.companyInfo.stateCode || '29',
        seller_phone: systemSettings.companyInfo.phone || '',
        seller_email: systemSettings.companyInfo.email || '',

        // Buyer details
        customer_id: invoiceData.customerId || null,
        buyer_gstin: invoiceData.customerGSTIN || null,
        buyer_name: invoiceData.customerName || 'Walk-in Customer',
        buyer_address: {
          street: invoiceData.customerAddress || '',
          city: '',
          state: invoiceData.customerState || '',
          pincode: ''
        },
        buyer_state_code: invoiceData.customerStateCode || '',
        buyer_phone: invoiceData.customerPhone || '',
        buyer_email: invoiceData.customerEmail || '',
        buyer_contact_person: invoiceData.customerContactPerson || '',

        // Consignee details
        consignee_name: invoiceData.consigneeName || null,
        consignee_gstin: invoiceData.consigneeGSTIN || null,
        consignee_address: invoiceData.consigneeAddress ? {
          street: invoiceData.consigneeAddress,
          city: '',
          state: invoiceData.consigneeState || '',
          pincode: ''
        } : null,
        consignee_state_code: invoiceData.consigneeStateCode || null,
        consignee_phone: invoiceData.consigneePhone || null,
        consignee_email: invoiceData.consigneeEmail || null,
        consignee_contact_person: invoiceData.consigneeContactPerson || null,

        // Place of supply
        place_of_supply: invoiceData.placeOfSupply || invoiceData.customerState || '',
        place_of_supply_code: invoiceData.customerStateCode || '29',

        // Financial totals
        subtotal: totals.subtotal,
        total_discount: 0, // Calculate from items if needed
        total_taxable_value: totals.subtotal,
        total_cgst: totals.totalTax / 2, // Assuming equal CGST/SGST split
        total_sgst: totals.totalTax / 2,
        total_igst: 0, // Set based on inter-state logic
        total_tax_amount: totals.totalTax,
        round_off: totals.roundOff || 0,
        total_amount: totals.grandTotal,

        // Payment details
        payment_method: invoiceData.paymentMethod || 'cash',
        payment_terms: invoiceData.paymentTerms || null,
        amount_paid: 0, // Draft invoices are not paid
        payment_status: 'pending',

        // E-way bill details
        ewaybill_number: invoiceData.ewaybillNo || null,
        ewaybill_date: invoiceData.ewaybillDate || null,
        vehicle_number: invoiceData.vehicleNo || null,
        transporter_id: invoiceData.transporterId || null,

        // Government portal fields (empty for draft)
        irn: null,
        ack_number: null,
        ack_date: null,
        qr_code_data: qrCodeData || generateEInvoiceQRData({
          invoice_number: invoiceData.invoiceNumber,
          seller_gstin: systemSettings.companyInfo.gstNumber || '29ABCDE1234F1Z5',
          buyer_gstin: invoiceData.customerGSTIN || '',
          invoice_date: invoiceData.invoiceDate,
          total_amount: totals.grandTotal,
          invoice_type: 'INV'
        }, items),

        // Additional fields
        notes: invoiceData.notes || '',
        terms_and_conditions: invoiceData.termsAndConditions || '',
        bank_details: systemSettings.bankDetails || {},
        previous_outstanding: outstandingAmount || 0,

        created_by: null // Would come from auth context
      };

      // Prepare items data for einvoice_items table
      const einvoiceItems = items.map((item, index) => ({
        product_id: item.productId || null,
        product_name: item.productName || item.name,
        product_code: item.productCode || item.code,
        description: item.description || '',
        hsn_code: item.hsn || '38089199',
        uqc: item.unit || 'KGS',
        quantity: parseFloat(item.quantity) || 0,
        unit_price: parseFloat(item.rate) || 0,
        gross_amount: parseFloat(item.quantity) * parseFloat(item.rate),
        discount_percentage: parseFloat(item.discount) || 0,
        discount_amount: 0, // Calculate if needed
        taxable_value: calculateItemAmount(item) / (1 + (parseFloat(item.gstRate) || 18) / 100),
        gst_rate: parseFloat(item.gstRate) || 18,
        cgst_rate: (parseFloat(item.gstRate) || 18) / 2,
        sgst_rate: (parseFloat(item.gstRate) || 18) / 2,
        igst_rate: 0, // Set based on inter-state logic
        cgst_amount: (calculateItemAmount(item) / (1 + (parseFloat(item.gstRate) || 18) / 100)) * ((parseFloat(item.gstRate) || 18) / 2) / 100,
        sgst_amount: (calculateItemAmount(item) / (1 + (parseFloat(item.gstRate) || 18) / 100)) * ((parseFloat(item.gstRate) || 18) / 2) / 100,
        igst_amount: 0,
        total_gst_amount: (calculateItemAmount(item) / (1 + (parseFloat(item.gstRate) || 18) / 100)) * (parseFloat(item.gstRate) || 18) / 100,
        total_amount: calculateItemAmount(item),
        batch_number: item.batchNo || null,
        manufacturing_date: item.mfgDate || null,
        expiry_date: item.expDate || null,
        item_serial_number: index + 1
      }));

      console.log('💾 Saving E-Invoice draft:', einvoiceData);
      console.log('📦 E-Invoice items:', einvoiceItems);

      // Save to database using the new comprehensive service
      const result = await einvoicesService.create(einvoiceData, einvoiceItems);
      console.log('✅ E-Invoice draft saved successfully:', result);

      // Show success dialog with options
      setSuccessMessage(
        'E-Invoice saved as draft successfully!\n\n' +
        'Would you like to view the E-Invoice History?'
      );
      setSuccessAction(() => () => onNavigate('e-invoice-history'));
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error saving E-Invoice:', error);
      alert('Error saving E-Invoice: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Generate and save E-Invoice
  const generateInvoice = async () => {
    try {
      setIsLoading(true);

      const validationErrors = validateInvoiceData();
      if (validationErrors.length > 0) {
        alert('Please fix the following errors:\n' + validationErrors.join('\n'));
        return;
      }

      // Create comprehensive E-invoice data for dedicated einvoices table
      const einvoiceData = {
        invoice_number: invoiceData.invoiceNumber,
        invoice_type: 'b2b',
        status: 'generated', // Generated status with IRN

        // Date fields
        invoice_date: invoiceData.invoiceDate,
        due_date: invoiceData.dueDate || null,
        supply_date_time: invoiceData.supplyDateTime ? new Date(invoiceData.supplyDateTime) : null,

        // Seller details (from system settings)
        seller_gstin: systemSettings.companyInfo.gstNumber || '29ABCDE1234F1Z5',
        seller_name: systemSettings.companyInfo.name || 'Krishisethu Agro Solutions',
        seller_address: systemSettings.companyInfo.address || {},
        seller_state_code: systemSettings.companyInfo.stateCode || '29',
        seller_phone: systemSettings.companyInfo.phone || '',
        seller_email: systemSettings.companyInfo.email || '',

        // Buyer details
        customer_id: invoiceData.customerId || null,
        buyer_gstin: invoiceData.customerGSTIN || null,
        buyer_name: invoiceData.customerName || 'Walk-in Customer',
        buyer_address: {
          street: invoiceData.customerAddress || '',
          city: '',
          state: invoiceData.customerState || '',
          pincode: ''
        },
        buyer_state_code: invoiceData.customerStateCode || '',
        buyer_phone: invoiceData.customerPhone || '',
        buyer_email: invoiceData.customerEmail || '',
        buyer_contact_person: invoiceData.customerContactPerson || '',

        // Consignee details
        consignee_name: invoiceData.consigneeName || null,
        consignee_gstin: invoiceData.consigneeGSTIN || null,
        consignee_address: invoiceData.consigneeAddress ? {
          street: invoiceData.consigneeAddress,
          city: '',
          state: invoiceData.consigneeState || '',
          pincode: ''
        } : null,
        consignee_state_code: invoiceData.consigneeStateCode || null,
        consignee_phone: invoiceData.consigneePhone || null,
        consignee_email: invoiceData.consigneeEmail || null,
        consignee_contact_person: invoiceData.consigneeContactPerson || null,

        // Place of supply
        place_of_supply: invoiceData.placeOfSupply || invoiceData.customerState || '',
        place_of_supply_code: invoiceData.customerStateCode || '29',

        // Financial totals
        subtotal: totals.subtotal,
        total_discount: 0,
        total_taxable_value: totals.subtotal,
        total_cgst: totals.totalTax / 2,
        total_sgst: totals.totalTax / 2,
        total_igst: 0,
        total_tax_amount: totals.totalTax,
        round_off: totals.roundOff || 0,
        total_amount: totals.grandTotal,

        // Payment details
        payment_method: invoiceData.paymentMethod || 'cash',
        payment_terms: invoiceData.paymentTerms || null,
        amount_paid: totals.grandTotal, // Generated invoices are considered paid
        payment_status: 'completed',

        // E-way bill details
        ewaybill_number: invoiceData.ewaybillNo || null,
        ewaybill_date: invoiceData.ewaybillDate || null,
        vehicle_number: invoiceData.vehicleNo || null,
        transporter_id: invoiceData.transporterId || null,

        // Government portal fields (simulated for demo)
        irn: invoiceData.irn || utilityService.generateIRN(),
        ack_number: invoiceData.ackNo || utilityService.generateAckNo(),
        ack_date: new Date().toISOString(),
        qr_code_data: qrCodeData || generateEInvoiceQRData({
          invoice_number: invoiceData.invoiceNumber,
          irn: invoiceData.irn || utilityService.generateIRN(),
          ack_number: invoiceData.ackNo || utilityService.generateAckNo(),
          ack_date: new Date().toISOString(),
          seller_gstin: systemSettings.companyInfo.gstNumber || '29ABCDE1234F1Z5',
          buyer_gstin: invoiceData.customerGSTIN || '',
          invoice_date: invoiceData.invoiceDate,
          total_amount: totals.grandTotal,
          invoice_type: 'INV'
        }, items),

        // Additional fields
        notes: invoiceData.notes || '',
        terms_and_conditions: invoiceData.termsAndConditions || '',
        bank_details: systemSettings.bankDetails || {},
        previous_outstanding: outstandingAmount || 0,

        created_by: null // Would come from auth context
      };

      // Prepare items data for einvoice_items table
      const einvoiceItems = items.map((item, index) => ({
        product_id: item.productId || null,
        product_name: item.productName || item.name,
        product_code: item.productCode || item.code,
        description: item.description || '',
        hsn_code: item.hsn || '38089199',
        uqc: item.unit || 'KGS',
        quantity: parseFloat(item.quantity) || 0,
        unit_price: parseFloat(item.rate) || 0,
        gross_amount: parseFloat(item.quantity) * parseFloat(item.rate),
        discount_percentage: parseFloat(item.discount) || 0,
        discount_amount: 0,
        taxable_value: calculateItemAmount(item) / (1 + (parseFloat(item.gstRate) || 18) / 100),
        gst_rate: parseFloat(item.gstRate) || 18,
        cgst_rate: (parseFloat(item.gstRate) || 18) / 2,
        sgst_rate: (parseFloat(item.gstRate) || 18) / 2,
        igst_rate: 0,
        cgst_amount: (calculateItemAmount(item) / (1 + (parseFloat(item.gstRate) || 18) / 100)) * ((parseFloat(item.gstRate) || 18) / 2) / 100,
        sgst_amount: (calculateItemAmount(item) / (1 + (parseFloat(item.gstRate) || 18) / 100)) * ((parseFloat(item.gstRate) || 18) / 2) / 100,
        igst_amount: 0,
        total_gst_amount: (calculateItemAmount(item) / (1 + (parseFloat(item.gstRate) || 18) / 100)) * (parseFloat(item.gstRate) || 18) / 100,
        total_amount: calculateItemAmount(item),
        batch_number: item.batchNo || null,
        manufacturing_date: item.mfgDate || null,
        expiry_date: item.expDate || null,
        item_serial_number: index + 1
      }));

      console.log('🚀 Generating E-Invoice:', einvoiceData);
      console.log('📦 E-Invoice items:', einvoiceItems);

      // Save to database using the new comprehensive service
      const result = await einvoicesService.create(einvoiceData, einvoiceItems);
      console.log('✅ E-Invoice generated successfully:', result);

      // Update customer balance after generating invoice
      if (invoiceData.customerId) {
        try {
          await customerBalanceService.updateBalance(invoiceData.customerId);
        } catch (error) {
          console.error('Error updating customer balance:', error);
        }
      }

      // Show success dialog with options
      setSuccessMessage(
        'E-Invoice generated successfully!\n\n' +
        'Invoice Number: ' + invoiceData.invoiceNumber + '\n' +
        'Customer: ' + invoiceData.customerName + '\n' +
        'Amount: ₹' + totals.grandTotal.toFixed(2) + '\n\n' +
        'Would you like to view the E-Invoice History?'
      );
      setSuccessAction(() => () => {
        onNavigate('e-invoice-history');
      });
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error generating E-Invoice:', error);
      alert('Error generating E-Invoice: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            E-Invoice Generation
          </h1>
          <p className="text-gray-600">
            Create GST-compliant formal invoices for business transactions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={saveDraft} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={generateInvoice} disabled={isLoading}>
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Generating...' : 'Generate Invoice'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="invoice-details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoice-details">Invoice Details</TabsTrigger>
          <TabsTrigger value="items">Items & Products</TabsTrigger>
          <TabsTrigger value="preview">Preview & Generate</TabsTrigger>
        </TabsList>

        {/* Invoice Details Tab */}
        <TabsContent value="invoice-details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Invoice Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Invoice Number</label>
                    <Input
                      value={invoiceData.invoiceNumber}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      placeholder="INV-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Invoice Date</label>
                    <Input
                      type="date"
                      value={invoiceData.invoiceDate}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="date"
                      value={invoiceData.dueDate}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Place of Supply</label>
                    <Input
                      value={invoiceData.placeOfSupply}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, placeOfSupply: e.target.value }))}
                      placeholder="State name"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </div>
                  {/* Real-time Customer Outstanding */}
                  {invoiceData.customerId && (
                    <div className="flex items-center gap-2">
                      {loadingOutstanding ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant={customerOutstanding > 0 ? "destructive" : "secondary"} className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Outstanding: ₹{customerOutstanding.toFixed(2)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadCustomerOutstanding(invoiceData.customerId)}
                            className="h-6 w-6 p-0"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={invoiceData.customerName}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Customer name"
                    className="flex-1"
                  />
                  <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Search className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Select Customer</DialogTitle>
                        <DialogDescription>Choose a customer from your database</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {customers.map((customer) => (
                          <div
                            key={customer.id}
                            className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                            <div className="text-sm text-gray-500">
                              {typeof customer.address === 'object' && customer.address
                                ? `${customer.address.street || ''} ${customer.address.city || ''} ${customer.address.state || ''} ${customer.address.pincode || ''}`.trim()
                                : customer.address || 'No address provided'
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                  {invoiceData.customerId && (
                    <Button variant="outline" size="sm" onClick={clearCustomerSelection} title="Clear customer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">GSTIN</label>
                  <Input
                    value={invoiceData.customerGSTIN}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, customerGSTIN: e.target.value }))}
                    placeholder="Customer GSTIN"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    value={invoiceData.customerAddress}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, customerAddress: e.target.value }))}
                    placeholder="Customer address"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={invoiceData.customerPhone}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      value={invoiceData.customerEmail}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">State</label>
                    <Input
                      value={invoiceData.customerState}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, customerState: e.target.value }))}
                      placeholder="State name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">State Code</label>
                    <Input
                      value={invoiceData.customerStateCode}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, customerStateCode: e.target.value }))}
                      placeholder="State code"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Person</label>
                    <Input
                      value={invoiceData.customerContactPerson}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, customerContactPerson: e.target.value }))}
                      placeholder="Contact person name"
                    />
                  </div>
                </div>

                {/* Outstanding Balance Display */}
                {invoiceData.customerId && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-yellow-800">Customer Outstanding Balance</h4>
                        <p className="text-sm text-yellow-600">Previous outstanding amount for this customer</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-800">
                          ₹{outstandingAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        {customerBalance && (
                          <div className="text-xs text-yellow-600">
                            Credit Limit: ₹{(customerBalance.creditLimit || 0).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    </div>
                    {outstandingAmount > 0 && (
                      <div className="mt-2 text-sm text-yellow-700">
                        <strong>Note:</strong> This amount will be added to the new invoice total in the outstanding section.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transport & Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Transport & Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dispatch Through</label>
                    <Input
                      value={invoiceData.despatchThrough}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, despatchThrough: e.target.value }))}
                      placeholder="e.g., Four Wheeler/Tata Ac"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Destination</label>
                    <Input
                      value={invoiceData.destination}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, destination: e.target.value }))}
                      placeholder="Destination city"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vehicle Number</label>
                    <Input
                      value={invoiceData.vehicleNo}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, vehicleNo: e.target.value }))}
                      placeholder="e.g., KA18A8523"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Other References</label>
                    <Input
                      value={invoiceData.otherRef}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, otherRef: e.target.value }))}
                      placeholder="Other reference details"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Method</label>
                    <Select value={invoiceData.paymentMethod} onValueChange={(value) => setInvoiceData(prev => ({ ...prev, paymentMethod: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date & Time of Supply</label>
                    <Input
                      type="datetime-local"
                      value={invoiceData.supplyDateTime}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, supplyDateTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">E-Way Bill Number</label>
                    <Input
                      value={invoiceData.ewaybillNo}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, ewaybillNo: e.target.value }))}
                      placeholder="E-Way Bill number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">E-Way Bill Date</label>
                    <Input
                      type="date"
                      value={invoiceData.ewaybillDate}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, ewaybillDate: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Items & Products Tab */}
        <TabsContent value="items" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Product */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Product
                  </div>
                  {/* Barcode Scanner Button */}
                  <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Scan className="h-4 w-4" />
                        Scan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Camera className="h-5 w-5" />
                          Barcode Scanner
                        </DialogTitle>
                        <DialogDescription>
                          Scan or enter product barcode to add items quickly
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Barcode</label>
                          <Input
                            placeholder="Scan or type barcode..."
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onKeyPress={handleBarcodeInput}
                            autoFocus
                            className="text-center font-mono"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleBarcodeSearch(barcodeInput)}
                            disabled={!barcodeInput.trim() || isScanning}
                            className="flex-1"
                          >
                            {isScanning ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Searching...
                              </>
                            ) : (
                              <>
                                <Search className="h-4 w-4 mr-2" />
                                Search Product
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setBarcodeInput('');
                              setShowBarcodeScanner(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          💡 Tip: Use a barcode scanner or type the barcode manually
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={currentItem.productName}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, productName: e.target.value }))}
                    placeholder="Product name"
                    className="flex-1"
                  />
                  <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Search className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Select Product</DialogTitle>
                        <DialogDescription>
                          Choose a product from your inventory ({products.length} products available)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1"
                          />
                          <Button variant="outline" size="sm" onClick={loadProducts} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {isLoading ? (
                            <div className="text-center py-4">
                              <div className="text-gray-500">Loading products...</div>
                            </div>
                          ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-4">
                              <div className="text-gray-500">
                                {searchTerm.trim() ? 'No products found matching your search' : 'No products available'}
                              </div>
                              {searchTerm.trim() && (
                                <div className="text-sm text-gray-400 mt-1">
                                  Try searching with different keywords
                                </div>
                              )}
                            </div>
                          ) : (
                            filteredProducts.map((product) => (
                              <div
                                key={product.id}
                                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                                onClick={() => handleProductSelect(product)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-gray-500">
                                      HSN: {product.hsn || 'N/A'} | Stock: {product.quantity || 0} {product.unit || 'PCS'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Price: ₹{product.sellingPrice || product.price || 0}
                                    </div>
                                  </div>
                                  <Badge variant="outline">{product.category || 'Uncategorized'}</Badge>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">HSN Code</label>
                    <Input
                      value={currentItem.hsn}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, hsn: e.target.value }))}
                      placeholder="HSN code"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit</label>
                    <Select value={currentItem.unit} onValueChange={(value) => setCurrentItem(prev => ({ ...prev, unit: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PCS">PCS</SelectItem>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="BAG">BAG</SelectItem>
                        <SelectItem value="LTR">LTR</SelectItem>
                        <SelectItem value="BOX">BOX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <Input
                      type="number"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rate (₹)</label>
                    <Input
                      type="number"
                      value={currentItem.rate}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">GST (%)</label>
                    <Input
                      type="number"
                      value={currentItem.gstRate}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, gstRate: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mfg Date</label>
                    <Input
                      type="date"
                      value={currentItem.mfgDate}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, mfgDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exp Date</label>
                    <Input
                      type="date"
                      value={currentItem.expDate}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, expDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Batch No</label>
                  <Input
                    value={currentItem.batchNo}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, batchNo: e.target.value }))}
                    placeholder="Batch number"
                  />
                </div>

                <Button onClick={addItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardContent>
            </Card>

            {/* Items List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Invoice Items ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No items added yet</p>
                      <p className="text-sm">Add products to create your invoice</p>
                    </div>
                  ) : (
                    items.map((item, index) => (
                      <div key={item.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-sm text-gray-500">
                              HSN: {item.hsn} | {item.quantity} {item.unit} × ₹{item.rate}
                            </div>
                            <div className="text-sm text-gray-500">
                              GST: {item.gstRate}% | Amount: ₹{calculateItemAmount(item).toFixed(2)}
                            </div>
                            {item.batchNo && (
                              <div className="text-sm text-gray-500">Batch: {item.batchNo}</div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals Summary */}
                {items.length > 0 && (
                  <div className="border-t pt-4 mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Tax:</span>
                      <span>₹{totals.totalTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Round Off:</span>
                      <span>₹{totals.roundOff.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-lg border-t pt-2">
                      <span>Grand Total:</span>
                      <span>₹{totals.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preview & Generate Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Invoice Preview
              </CardTitle>
              <CardDescription>
                Review your invoice before generating
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items to preview</p>
                  <p className="text-sm">Add items to see the invoice preview</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div id="printable-einvoice">
                    <InvoicePreview
                      sale={{
                        saleNumber: invoiceData.invoiceNumber,
                        saleDate: invoiceData.invoiceDate,
                        customerName: invoiceData.customerName,
                        customerGSTIN: invoiceData.customerGSTIN,
                        customerAddress: invoiceData.customerAddress,
                        customerPhone: invoiceData.customerPhone,
                        customerState: invoiceData.customerState,
                        customerStateCode: invoiceData.customerStateCode,
                        customerContactPerson: invoiceData.customerContactPerson,
                        // Consignee details
                        consigneeName: invoiceData.consigneeName,
                        consigneeGSTIN: invoiceData.consigneeGSTIN,
                        consigneeAddress: invoiceData.consigneeAddress,
                        consigneePhone: invoiceData.consigneePhone,
                        consigneeState: invoiceData.consigneeState,
                        consigneeStateCode: invoiceData.consigneeStateCode,
                        consigneeContactPerson: invoiceData.consigneeContactPerson,
                        placeOfSupply: invoiceData.placeOfSupply,
                        despatchThrough: invoiceData.despatchThrough,
                        destination: invoiceData.destination,
                        ewaybillNo: invoiceData.ewaybillNo,
                        ewaybillDate: invoiceData.ewaybillDate,
                        vehicleNo: invoiceData.vehicleNo,
                        otherRef: invoiceData.otherRef,
                        paymentMethod: invoiceData.paymentMethod,
                        supplyDateTime: invoiceData.supplyDateTime,
                        ackNo: invoiceData.ackNo,
                        ackDate: invoiceData.ackDate,
                        irn: invoiceData.irn,
                        items: items.map(item => ({
                          productName: item.productName,
                          hsn: item.hsn,
                          quantity: item.quantity,
                          unit: item.unit,
                          unitPrice: item.rate,
                          mrp: item.mrp,
                          gstRate: item.gstRate,
                          mfgDate: item.mfgDate,
                          expDate: item.expDate,
                          batchNo: item.batchNo,
                          totalPrice: calculateItemAmount(item)
                        })),
                        subtotal: totals.subtotal,
                        tax: totals.totalTax,
                        total: totals.grandTotal,
                        roundOff: totals.roundOff,
                        previousOutstanding: outstandingAmount,
                        notes: invoiceData.notes
                      }}
                      settings={systemSettings}
                    />
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => window.print()}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Invoice
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={generateInvoice} disabled={isLoading}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isLoading ? 'Generating...' : 'Generate & Save'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real-time QR Code Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Real-time QR Code
              </CardTitle>
              <CardDescription>
                GST-compliant QR code generated from current invoice data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QR Code Display */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                    {generatingQR ? (
                      <div className="flex flex-col items-center justify-center w-48 h-48">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                        <p className="text-sm text-gray-600">Generating QR Code...</p>
                      </div>
                    ) : qrCodeImage ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={qrCodeImage}
                          alt="E-Invoice QR Code"
                          className="w-48 h-48 border rounded"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Generated: {new Date().toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-48 h-48 text-gray-400">
                        <QrCode className="h-12 w-12 mb-2" />
                        <p className="text-sm">QR Code will appear here</p>
                        <p className="text-xs">Add invoice details to generate</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateRealTimeQRCode}
                      disabled={generatingQR || !invoiceData.invoiceNumber}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${generatingQR ? 'animate-spin' : ''}`} />
                      {generatingQR ? 'Generating...' : 'Refresh QR'}
                    </Button>

                    {qrCodeImage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.download = `qr-${invoiceData.invoiceNumber || 'invoice'}.png`;
                          link.href = qrCodeImage;
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>

                {/* QR Code Data */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">QR Code Data</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono break-all">
                      {qrCodeData || 'QR data will appear here when generated'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">QR Code Components</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Invoice Number:</span>
                        <span className="font-medium">{invoiceData.invoiceNumber || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium">₹{totals.grandTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Seller GSTIN:</span>
                        <span className="font-medium">{systemSettings.companyInfo.gstNumber || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Buyer GSTIN:</span>
                        <span className="font-medium">{invoiceData.customerGSTIN || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items Count:</span>
                        <span className="font-medium">{items.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">IRN Status:</span>
                        <span className={`font-medium ${invoiceData.irn ? 'text-green-600' : 'text-yellow-600'}`}>
                          {invoiceData.irn ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-800 mb-1">📱 Real-time QR Code</p>
                    <p>This QR code is generated in real-time based on your current invoice data and complies with GST E-Invoice standards. It updates automatically as you modify invoice details.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Success!</DialogTitle>
            <DialogDescription>
              {successMessage.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={handleSuccessCancel}>
              {successMessage.includes('generated successfully') ? 'Create Another Invoice' : 'Continue'}
            </Button>
            <Button onClick={handleSuccessConfirm} className="bg-blue-600 hover:bg-blue-700">
              View E-Invoice History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EInvoice;
