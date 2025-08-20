import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  BookOpen,
  ArrowLeft,
  Search,
  Download,
  ExternalLink,
  Play,
  FileText,
  Lightbulb,
  Settings,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Printer,
  ChevronRight,
  Home,
  CheckCircle,
  Truck
} from 'lucide-react';

const Documentation = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('getting-started');
  const [selectedGuide, setSelectedGuide] = useState(null);

  // Actual documentation content
  const documentationContent = {
    'quick-start': {
      title: 'Quick Start Guide',
      content: `
# Quick Start Guide

Welcome to KrishiSethu Inventory Management System! This guide will help you get started in just 5 minutes.

## Step 1: Login to the System
1. Open your web browser and navigate to the application URL
2. Enter your username and password provided by your administrator
3. Click "Login" to access the dashboard

## Step 2: Navigate the Dashboard
- **Dashboard**: Overview of your business metrics
- **Inventory**: Manage your products and stock
- **POS**: Process sales transactions
- **Reports**: View sales and inventory reports

## Step 3: Add Your First Product
1. Click on "Inventory" in the sidebar
2. Click the "Add Product" button
3. Fill in the product details:
   - Product Name (e.g., "Urea Fertilizer")
   - Category (e.g., "Fertilizers")
   - Brand (e.g., "IFFCO")
   - Purchase Price and Selling Price
   - Initial Stock Quantity
4. Click "Save Product"

## Step 4: Make Your First Sale
1. Go to "POS" from the sidebar
2. Search for the product you just added
3. Click "Add to Cart"
4. Enter customer details (optional)
5. Select payment method
6. Click "Complete Sale"

## Step 5: View Reports
1. Navigate to "Reports"
2. Check your sales summary
3. Review inventory levels

🎉 Congratulations! You've completed the basic setup and made your first sale.
      `
    },
    'system-overview': {
      title: 'System Overview',
      content: `
# System Overview

KrishiSethu is a comprehensive inventory management system designed specifically for agricultural businesses.

## Main Modules

### 📊 Dashboard
- Real-time business metrics
- Sales overview
- Stock alerts
- Quick actions

### 📦 Inventory Management
- Product catalog management
- Stock tracking
- Category and brand organization
- Batch and expiry tracking
- Low stock alerts

### 🛒 Point of Sale (POS)
- Fast product search
- Cart management
- Multiple payment methods
- Receipt generation
- Customer management

### 📈 Reports & Analytics
- Sales reports
- Inventory reports
- Financial summaries
- Export capabilities

### 👥 User Management
- Role-based access control
- Staff management
- Permission settings

### ⚙️ Settings
- Company information
- Tax settings
- System preferences
- Backup management

## Key Features

### Offline Support
- Works without internet connection
- Automatic sync when online
- Local data storage

### Mobile Responsive
- Works on tablets and phones
- Touch-friendly interface
- Mobile POS capabilities

### Security
- User authentication
- Role-based permissions
- Data encryption
- Secure backups
      `
    },
    'adding-products': {
      title: 'Adding Products',
      content: `
# Adding Products to Inventory

Learn how to add fertilizers, seeds, and pesticides to your inventory system.

## Adding a Single Product

### Step 1: Navigate to Add Product
1. Click "Inventory" in the sidebar
2. Click the "Add Product" button (+ icon)
3. The Add Product form will open

### Step 2: Fill Product Information

#### Basic Details
- **Product Name**: Enter the full product name (e.g., "Urea Fertilizer 50kg")
- **Category**: Select from dropdown (Fertilizers, Seeds, Pesticides, etc.)
- **Brand**: Choose the manufacturer brand
- **Description**: Add detailed product description

#### Pricing Information
- **Purchase Price**: Cost price from supplier
- **Selling Price**: Retail price for customers
- **MRP**: Maximum Retail Price (if applicable)
- **Tax Rate**: GST percentage (usually 5% for fertilizers)

#### Stock Information
- **Initial Quantity**: Starting stock amount
- **Unit**: Measurement unit (kg, bags, liters, etc.)
- **Reorder Point**: Minimum stock level for alerts
- **Reorder Quantity**: Suggested reorder amount

#### Additional Information
- **HSN Code**: For GST compliance
- **Batch Number**: If tracking batches
- **Expiry Date**: For products with expiration
- **Supplier**: Primary supplier information

### Step 3: Save the Product
1. Review all information
2. Click "Save Product"
3. Product will appear in inventory list

## Adding Multiple Products (Bulk Add)

### Using Bulk Add Table
1. Go to Inventory → "Bulk Add"
2. Use the table to add multiple products at once
3. Fill each row with product details
4. Click "Save All Products"

### Using CSV Import
1. Download the CSV template
2. Fill the template with your products
3. Upload the completed CSV file
4. Review and confirm the import

## Product Categories

### Default Categories
- **Fertilizers**: NPK, Urea, DAP, Organic fertilizers
- **Seeds**: Vegetable seeds, Crop seeds, Flower seeds
- **Pesticides**: Insecticides, Fungicides, Herbicides
- **Tools**: Farming equipment and tools
- **Others**: Miscellaneous agricultural products

### Creating New Categories
1. Go to Settings → "Categories Management"
2. Click "Add Category"
3. Enter category name and description
4. Save the new category

## Best Practices

### Naming Convention
- Use descriptive names: "NPK 19:19:19 Fertilizer 50kg"
- Include size/weight in the name
- Be consistent across similar products

### Pricing Strategy
- Set competitive selling prices
- Include all costs in purchase price
- Regular price reviews and updates

### Stock Management
- Set appropriate reorder points
- Monitor fast-moving vs slow-moving items
- Regular stock audits and adjustments
      `
    },
    'stock-management': {
      title: 'Stock Management',
      content: `
# Stock Management Guide

Comprehensive guide to managing stock levels, movements, and alerts in your inventory system.

## Stock Tracking

### Current Stock Levels
- View real-time stock quantities
- Color-coded status indicators:
  - 🟢 Green: Good stock (above reorder point)
  - 🟡 Yellow: Low stock (at reorder point)
  - 🔴 Red: Out of stock (zero quantity)

### Stock Movements
Track all stock changes including:
- **Sales**: Automatic reduction from POS
- **Purchases**: Manual stock additions
- **Adjustments**: Manual corrections
- **Returns**: Customer/supplier returns
- **Damage/Loss**: Stock write-offs

## Managing Stock Alerts

### Low Stock Alerts
1. Set reorder points for each product
2. System automatically generates alerts
3. View alerts in Dashboard or Alerts panel
4. Take action: reorder or adjust levels

### Expiry Alerts
- Monitor products approaching expiry
- Get alerts 30, 7, and 1 day before expiry
- Take action: discount pricing or return to supplier

### Setting Up Alerts
1. Go to product details
2. Set "Reorder Point" (e.g., 10 units)
3. Set "Reorder Quantity" (e.g., 50 units)
4. Enable "Auto Reorder" if desired

## Stock Adjustments

### When to Adjust Stock
- Physical count differences
- Damaged goods
- Theft or loss
- Supplier returns
- Promotional giveaways

### How to Adjust Stock
1. Go to Inventory → Select product
2. Click "Adjust Stock"
3. Enter new quantity or adjustment amount
4. Add reason for adjustment
5. Save the adjustment

## Batch Management

### Tracking Batches
- Assign batch numbers to products
- Track expiry dates per batch
- Monitor batch-wise stock levels
- FIFO (First In, First Out) management

### Adding New Batches
1. Select product in inventory
2. Click "Add Batch"
3. Enter batch details:
   - Batch number
   - Quantity
   - Expiry date
   - Supplier
   - Cost price
4. Save batch information

## Stock Reports

### Available Reports
- **Current Stock Report**: All products with quantities
- **Low Stock Report**: Products below reorder point
- **Stock Movement Report**: All stock transactions
- **Expiry Report**: Products approaching expiry
- **Stock Valuation Report**: Total inventory value

### Generating Reports
1. Go to Reports section
2. Select report type
3. Choose date range (if applicable)
4. Click "Generate Report"
5. Export to PDF or Excel if needed

## Best Practices

### Regular Stock Audits
- Conduct monthly physical counts
- Compare with system quantities
- Investigate and resolve discrepancies
- Update reorder points based on sales patterns

### Inventory Optimization
- Analyze fast vs slow-moving items
- Adjust reorder points seasonally
- Minimize dead stock
- Optimize storage space

### Documentation
- Keep records of all adjustments
- Document reasons for stock changes
- Maintain supplier delivery receipts
- Regular backup of inventory data
      `
    },
    'making-sales': {
      title: 'Making Sales',
      content: `
# Making Sales - Complete POS Guide

Learn how to process sales transactions efficiently using the Point of Sale system.

## Starting a Sale

### Step 1: Access POS System
1. Click "POS" in the main navigation
2. The POS interface will load with:
   - Product search bar
   - Shopping cart (empty)
   - Customer information section
   - Payment options

### Step 2: Add Products to Cart

#### Method 1: Search and Add
1. Type product name in search bar
2. Select from search results
3. Click "Add to Cart"
4. Adjust quantity if needed

#### Method 2: Browse Categories
1. Click on category filters
2. Browse available products
3. Click "Add to Cart" for desired items

#### Method 3: Barcode Scanning (if available)
1. Click barcode scanner icon
2. Scan product barcode
3. Product automatically added to cart

### Step 3: Review Cart Items
- Check product names and quantities
- Verify prices are correct
- Remove items if needed
- Apply discounts if applicable

## Customer Information

### Adding Customer Details
1. Click "Add Customer" in POS
2. Enter customer information:
   - Name
   - Phone number
   - Address (optional)
   - Email (optional)
3. Save customer for future reference

### Existing Customers
1. Search by name or phone
2. Select from customer list
3. Customer details auto-populate

## Payment Processing

### Cash Payments
1. Select "Cash" payment method
2. Enter amount received
3. System calculates change
4. Complete transaction

### Card Payments
1. Select "Card" payment method
2. Enter card details or use card reader
3. Process payment
4. Wait for confirmation

### UPI Payments
1. Select "UPI" payment method
2. Generate QR code or enter UPI ID
3. Customer scans/pays
4. Confirm payment received

### Split Payments
1. Select multiple payment methods
2. Allocate amounts to each method
3. Process each payment separately
4. Complete transaction

## Completing the Sale

### Final Steps
1. Review total amount
2. Confirm payment received
3. Click "Complete Sale"
4. Generate receipt

### Receipt Options
- Print thermal receipt
- Email receipt to customer
- SMS receipt (if configured)
- Save digital copy

## Post-Sale Actions

### Inventory Updates
- Stock automatically reduced
- Real-time inventory updates
- Low stock alerts triggered if applicable

### Sales Recording
- Transaction saved to sales history
- Customer purchase history updated
- Reports data updated

## Best Practices

### Speed and Efficiency
- Learn keyboard shortcuts
- Use barcode scanning when possible
- Keep frequently sold items easily accessible
- Pre-configure common discounts

### Customer Service
- Greet customers warmly
- Double-check orders before payment
- Offer receipt options
- Thank customers for their business

### Accuracy
- Verify quantities and prices
- Check customer information
- Confirm payment amounts
- Review receipt before printing

## Troubleshooting Common Issues

### Product Not Found
- Check spelling in search
- Try partial product name
- Browse by category
- Add new product if needed

### Payment Issues
- Verify payment method is working
- Check network connection for card/UPI
- Have backup payment options ready
- Contact technical support if needed

### Printer Problems
- Check printer connection
- Verify paper is loaded
- Restart printer if needed
- Use email receipt as backup
      `
    },
    'troubleshooting': {
      title: 'Troubleshooting Guide',
      content: `
# Troubleshooting Guide

Common issues and their solutions for the KrishiSethu Inventory Management System.

## Login Issues

### Cannot Login
**Problem**: Unable to access the system with username/password

**Solutions**:
1. **Check Credentials**
   - Verify username spelling
   - Check caps lock is off
   - Ensure password is correct
   - Try typing password in notepad first

2. **Browser Issues**
   - Clear browser cache and cookies
   - Try different browser (Chrome, Firefox, Edge)
   - Disable browser extensions
   - Check if JavaScript is enabled

3. **Network Issues**
   - Check internet connection
   - Try accessing other websites
   - Contact network administrator
   - Try mobile hotspot as backup

4. **Account Issues**
   - Contact administrator to verify account status
   - Check if account is locked/suspended
   - Verify user permissions
   - Request password reset if needed

### Forgot Password
1. Click "Forgot Password" on login page
2. Enter your username/email
3. Check email for reset instructions
4. Follow link to create new password
5. Contact admin if no email received

## Performance Issues

### Slow Loading
**Problem**: Application takes too long to load

**Solutions**:
1. **Browser Optimization**
   - Close unnecessary browser tabs
   - Clear browser cache
   - Update browser to latest version
   - Restart browser

2. **Network Optimization**
   - Check internet speed
   - Move closer to WiFi router
   - Use wired connection if possible
   - Contact ISP if speed is consistently slow

3. **Device Optimization**
   - Close other applications
   - Restart computer/device
   - Check available RAM and storage
   - Update device drivers

### Application Freezing
**Problem**: Application becomes unresponsive

**Solutions**:
1. **Immediate Actions**
   - Wait 30 seconds for response
   - Press Ctrl+F5 to hard refresh
   - Close and reopen browser tab
   - Restart browser completely

2. **Prevention**
   - Don't open too many tabs
   - Save work frequently
   - Use recommended browsers
   - Keep browser updated

## Data Issues

### Missing Products
**Problem**: Products not showing in inventory

**Solutions**:
1. **Check Filters**
   - Clear all search filters
   - Check category selections
   - Verify date ranges
   - Reset view to "All Products"

2. **Database Sync**
   - Refresh the page
   - Check internet connection
   - Wait for sync to complete
   - Contact admin if data missing

### Incorrect Stock Levels
**Problem**: Stock quantities don't match physical count

**Solutions**:
1. **Verify Recent Transactions**
   - Check recent sales in POS
   - Review stock adjustments
   - Look for pending transactions
   - Check for duplicate entries

2. **Manual Correction**
   - Go to product details
   - Click "Adjust Stock"
   - Enter correct quantity
   - Add reason for adjustment
   - Save changes

## Printing Issues

### Receipt Not Printing
**Problem**: Thermal printer not working

**Solutions**:
1. **Hardware Check**
   - Verify printer is powered on
   - Check USB/network connection
   - Ensure paper is loaded correctly
   - Check for paper jams

2. **Software Check**
   - Verify printer is selected in settings
   - Check printer drivers are installed
   - Test print from other applications
   - Restart print spooler service

3. **Alternative Solutions**
   - Use email receipts
   - Print to PDF
   - Use different printer
   - Manual receipt writing as backup

### Poor Print Quality
**Problem**: Receipts are faded or unclear

**Solutions**:
1. **Replace thermal paper**
2. **Clean printer head**
3. **Check printer settings**
4. **Adjust print density**
5. **Contact printer manufacturer**

## Network Issues

### Offline Mode
**Problem**: No internet connection

**Solutions**:
1. **Continue Working**
   - System works offline
   - Data saved locally
   - Sync when connection restored

2. **Restore Connection**
   - Check WiFi/ethernet connection
   - Restart router/modem
   - Contact network provider
   - Use mobile hotspot temporarily

### Sync Problems
**Problem**: Data not syncing between devices

**Solutions**:
1. **Force Sync**
   - Click sync button in app
   - Refresh browser page
   - Check sync status indicator
   - Wait for completion

2. **Check Conflicts**
   - Review sync error messages
   - Resolve data conflicts manually
   - Contact support for assistance

## Getting Help

### Self-Help Resources
1. **Documentation**: Check this help system
2. **Video Tutorials**: Available in help section
3. **FAQ**: Common questions and answers
4. **User Manual**: Downloadable PDF guide

### Contact Support
1. **Email Support**: support@krishisethu.com
2. **Phone Support**: +91-XXXX-XXXXXX
3. **Live Chat**: Available during business hours
4. **Remote Assistance**: Screen sharing support

### Information to Provide
When contacting support, include:
- Description of the problem
- Steps you've already tried
- Browser and version
- Operating system
- Screenshots of error messages
- Time when problem occurred

## Preventive Measures

### Regular Maintenance
1. **Daily**
   - Close browser properly
   - Save work frequently
   - Check for updates

2. **Weekly**
   - Clear browser cache
   - Restart computer
   - Check printer supplies

3. **Monthly**
   - Update browser
   - Review user accounts
   - Backup important data
   - Check system performance
      `
    },

    // Orders & Purchasing Documentation Content
    'purchase-orders': {
      title: 'Purchase Orders',
      content: `
# Purchase Orders Management

Learn how to create and manage purchase orders efficiently to streamline your procurement process.

## Creating a Purchase Order

### Step 1: Navigate to Purchase Orders
1. Click "Orders" in the main navigation
2. Select "Purchases" from the submenu
3. Click the "New Purchase" button

### Step 2: Fill Order Details

#### Supplier Information
- **Select Supplier**: Choose from existing suppliers or add new one
- **Supplier Contact**: Verify contact details are current
- **Payment Terms**: Review agreed payment terms

#### Product Information
- **Select Product**: Choose from your product catalog
- **Quantity**: Enter the quantity to order
- **Unit Price**: Set the agreed price per unit
- **Total Amount**: Automatically calculated

#### Order Details
- **Purchase Date**: Date of order creation
- **Expected Delivery**: Estimated delivery date
- **Invoice Number**: Supplier's invoice reference
- **Notes**: Additional instructions or comments

### Step 3: Review and Save
1. Verify all information is correct
2. Check calculations and totals
3. Click "Save Purchase" to create the order
4. Order number is automatically generated

## Order Status Management

### Order Statuses
- **Pending**: Order created, awaiting supplier confirmation
- **Confirmed**: Supplier has confirmed the order
- **Shipped**: Order is in transit from supplier
- **Received**: Order delivered and stock updated
- **Cancelled**: Order cancelled before delivery

### Updating Order Status
1. Find the order in the purchase list
2. Click on the order to view details
3. Update status as needed
4. Add notes about status changes

## Payment Tracking

### Payment Status Options
- **Pending**: Payment not yet made
- **Partial**: Partial payment made
- **Paid**: Full payment completed
- **Overdue**: Payment past due date

### Recording Payments
1. Open the purchase order
2. Click "Record Payment"
3. Enter payment amount and method
4. Add payment reference/receipt number
5. Save payment record

## Best Practices

### Order Planning
- Plan orders based on sales forecasts
- Consider seasonal demand variations
- Maintain optimal stock levels
- Build good supplier relationships

### Documentation
- Keep all supplier communications
- Maintain delivery receipts
- Track payment confirmations
- Regular order performance reviews

### Quality Control
- Inspect deliveries upon receipt
- Verify quantities and quality
- Report discrepancies immediately
- Update inventory accurately
      `
    },

    'supplier-management': {
      title: 'Supplier Management',
      content: `
# Supplier Management

Build and maintain strong supplier relationships with comprehensive supplier management tools.

## Adding New Suppliers

### Step 1: Navigate to Suppliers
1. Go to Orders → Suppliers
2. Click "Add New Supplier" button
3. Supplier form will open

### Step 2: Basic Information
- **Supplier Name**: Full business name
- **Contact Person**: Primary contact name
- **Phone Number**: Primary contact number
- **Email Address**: Business email
- **Website**: Company website (optional)

### Step 3: Address Information
- **Business Address**: Complete address
- **City**: Supplier's city
- **State**: State/province
- **PIN Code**: Postal code
- **Country**: Country (default: India)

### Step 4: Business Details
- **GST Number**: Tax registration number
- **PAN Number**: Permanent account number
- **Business Type**: Corporation, Partnership, etc.
- **Registration Date**: Business registration date

### Step 5: Payment Terms
- **Credit Period**: Payment terms (e.g., 30 days)
- **Credit Limit**: Maximum credit allowed
- **Payment Method**: Preferred payment method
- **Bank Details**: For direct transfers

## Supplier Information Management

### Contact Management
- Multiple contact persons
- Department-wise contacts
- Emergency contact numbers
- Communication preferences

### Product Catalogs
- Supplier's product list
- Current pricing
- Minimum order quantities
- Lead times for delivery

### Performance Tracking
- Delivery performance metrics
- Quality ratings
- Price competitiveness
- Payment history

### Document Management
- Contracts and agreements
- Certificates and licenses
- Insurance documents
- Quality certifications

## Best Practices

### Relationship Building
- Regular communication
- Fair payment terms
- Mutual respect and trust
- Long-term partnerships

### Risk Management
- Multiple suppliers for critical items
- Regular supplier audits
- Backup supplier identification
- Contract terms clarity
      `
    },

    'purchase-entry': {
      title: 'Purchase Entry',
      content: `
# Purchase Entry

Record incoming stock and maintain accurate purchase records for effective inventory management.

## Recording a Purchase

### Step 1: Access Purchase Entry
1. Navigate to Orders → Purchase Entry
2. Click "New Purchase Entry"
3. Purchase entry form opens

### Step 2: Supplier Selection
- **Choose Supplier**: Select from dropdown list
- **Verify Details**: Confirm supplier information
- **Invoice Reference**: Enter supplier's invoice number
- **Purchase Date**: Date of actual purchase

### Step 3: Product Entry

#### Single Product Entry
- **Select Product**: Choose from product catalog
- **Quantity**: Enter quantity received
- **Unit Cost**: Cost per unit from supplier
- **Total Cost**: Automatically calculated
- **Batch Number**: If applicable
- **Expiry Date**: For perishable items

#### Multiple Product Entry
- **Add Multiple Items**: Use "Add Item" button
- **Bulk Entry**: For large purchases
- **CSV Import**: For very large orders
- **Review Totals**: Verify all calculations

### Step 4: Additional Information
- **Freight Charges**: Transportation costs
- **Other Charges**: Handling, insurance, etc.
- **Discount**: Any supplier discounts
- **Tax Details**: GST and other taxes
- **Payment Method**: How payment was made

### Step 5: Save and Update Inventory
1. Review all entered information
2. Verify calculations are correct
3. Click "Save Purchase Entry"
4. Inventory automatically updated
5. Stock levels reflect new quantities

## Best Practices

### Accuracy
- Double-check all quantities
- Verify pricing against agreements
- Ensure proper documentation
- Regular reconciliation with suppliers

### Efficiency
- Batch similar entries together
- Use templates for regular suppliers
- Automate where possible
- Regular data backup
      `
    },

    'order-tracking': {
      title: 'Order Tracking',
      content: `
# Order Tracking

Monitor order status and delivery schedules with comprehensive tracking tools.

## Order Status Overview

### Status Definitions
- **Pending**: Order created, awaiting supplier confirmation
- **Confirmed**: Supplier has acknowledged and confirmed the order
- **Processing**: Supplier is preparing the order for shipment
- **Shipped**: Order has been dispatched from supplier
- **In Transit**: Order is on the way to your location
- **Delivered**: Order has reached your premises
- **Received**: Order has been received and verified
- **Completed**: Order fully processed and stock updated

### Tracking Features
- **Real-time Monitoring**: Overview of all active orders
- **Status Indicators**: Color-coded status display
- **Progress Tracking**: Visual progress bars
- **Alert Notifications**: Status change alerts

### Delivery Tracking
- **Expected Delivery Dates**: Estimated arrival times
- **Actual Delivery Dates**: Confirmed delivery times
- **Delivery Performance**: On-time delivery metrics
- **Delay Notifications**: Alerts for delayed orders

## Order Management

### Viewing Order Details
1. Go to Orders → Purchases
2. Click on any order to view details
3. See complete order information
4. Track status history and changes

### Updating Order Status
1. Open the specific order
2. Click "Update Status"
3. Select new status from dropdown
4. Add notes about the change
5. Save the update

## Best Practices

### Proactive Management
- Regular status updates
- Early communication with suppliers
- Anticipate potential delays
- Maintain backup suppliers

### Documentation
- Keep detailed records
- Document all communications
- Maintain delivery receipts
- Regular data backups
      `
    },

    // User Management Documentation Content
    'user-roles': {
      title: 'User Roles & Permissions',
      content: `
# User Roles & Permissions

Understanding the different user types and access levels in the KrishiSethu system.

## User Role Hierarchy

### 1. Admin Role
**Highest level access with full system control**

#### Permissions:
- ✅ **User Management**: Create, edit, delete users
- ✅ **Product Management**: Full inventory control
- ✅ **Sales Processing**: Complete POS access
- ✅ **Purchase Management**: Supplier and order management
- ✅ **Financial Reports**: All financial data access
- ✅ **System Settings**: Configuration and preferences
- ✅ **Data Export**: Export all system data
- ✅ **Backup Management**: System backup and restore

#### Responsibilities:
- System administration and maintenance
- User account management
- Security and access control
- System configuration and settings
- Data backup and recovery

### 2. Manager Role
**Operational management with business oversight**

#### Permissions:
- ✅ **Product Management**: Full inventory control
- ✅ **Sales Processing**: Complete POS access
- ✅ **Purchase Management**: Supplier and order management
- ✅ **Financial Reports**: Business performance data
- ✅ **Data Export**: Business data export
- ❌ **User Management**: Cannot manage users
- ❌ **System Settings**: Limited settings access

#### Responsibilities:
- Daily business operations
- Inventory management
- Supplier relationships
- Sales oversight
- Performance monitoring

### 3. Staff Role
**Operational staff with limited access**

#### Permissions:
- ✅ **Sales Processing**: POS and customer service
- ✅ **Product Viewing**: View inventory information
- ✅ **Basic Reports**: Sales and inventory reports
- ❌ **Product Management**: Cannot add/edit products
- ❌ **Purchase Management**: No supplier access
- ❌ **Financial Reports**: No financial data access
- ❌ **User Management**: Cannot manage users

#### Responsibilities:
- Customer service and sales
- Daily transactions
- Basic inventory checks
- Receipt generation

### 4. Viewer Role
**Read-only access for monitoring**

#### Permissions:
- ✅ **View Products**: Read-only inventory access
- ✅ **View Reports**: Basic reporting access
- ❌ **Sales Processing**: Cannot process sales
- ❌ **Data Modification**: No edit permissions
- ❌ **Management Functions**: No administrative access

#### Responsibilities:
- Monitoring and observation
- Report viewing
- Data analysis (read-only)

## Permission System

### Granular Permissions
Each role has specific permissions that control access to different features:

- **canManageProducts**: Add, edit, delete products
- **canProcessSales**: Use POS system
- **canViewReports**: Access reporting features
- **canManageUsers**: User administration
- **canManageSettings**: System configuration
- **canManageSuppliers**: Supplier management
- **canManagePurchases**: Purchase order management
- **canViewFinancials**: Financial data access
- **canExportData**: Data export capabilities
- **canManageInventory**: Stock management

### Role-Based Access Control (RBAC)
- Users are assigned one primary role
- Permissions are inherited from the role
- Custom permissions can be set per user
- Access is checked at every system interaction

## Best Practices

### Role Assignment
- Assign the minimum required role for each user
- Regularly review user roles and permissions
- Use the principle of least privilege
- Document role assignments and changes

### Security Considerations
- Regular permission audits
- Monitor user activity logs
- Implement strong password policies
- Regular access reviews and updates

### User Management
- Clear role definitions and responsibilities
- Regular training on system access
- Proper onboarding and offboarding procedures
- Maintain user documentation and guides
      `
    },

    'adding-users': {
      title: 'Adding Users',
      content: `
# Adding Users

Learn how to create new user accounts with appropriate roles and permissions.

## Prerequisites

### Admin Access Required
- Only users with **Admin** role can create new users
- Ensure you have proper administrative privileges
- Access to User Management section

### Information Needed
Before creating a user, gather:
- **Full Name**: User's complete name
- **Email Address**: Valid business email
- **Phone Number**: Contact number
- **Role**: Appropriate role for the user
- **Initial Password**: Secure temporary password

## Step-by-Step User Creation

### Step 1: Access User Management
1. Log in with Admin credentials
2. Navigate to **User Management** from the sidebar
3. Click the **"Add User"** button
4. User creation dialog will open

### Step 2: Fill Basic Information

#### Personal Details
- **Full Name**: Enter the user's complete name
  - Example: "Rajesh Kumar Sharma"
- **Email Address**: Business email address
  - Example: "rajesh@krishisethu.com"
  - Must be unique in the system
- **Phone Number**: Contact number with country code
  - Example: "+91-9876543210"

#### Account Details
- **Role Selection**: Choose appropriate role
  - Admin: Full system access
  - Manager: Business operations
  - Staff: Daily operations
  - Viewer: Read-only access

### Step 3: Set Password

#### Password Requirements
- Minimum 8 characters
- Include uppercase and lowercase letters
- Include at least one number
- Include special characters
- Avoid common passwords

#### Password Setup
1. Enter a secure temporary password
2. Confirm the password
3. User will be required to change on first login
4. Consider using a password generator

### Step 4: Configure Permissions

#### Default Permissions
- System automatically assigns default permissions based on role
- Review the permission list
- Modify if custom access is needed

#### Custom Permissions
If needed, you can customize permissions:
- **Product Management**: Inventory control
- **Sales Processing**: POS access
- **Report Access**: Reporting features
- **Supplier Management**: Vendor relations
- **Financial Access**: Financial data

### Step 5: Account Activation

#### Activation Settings
- **Active Status**: Enable/disable account
- **Start Date**: When access begins
- **Notifications**: Email notifications to user

#### Save and Create
1. Review all information carefully
2. Click **"Create User"** button
3. System creates the account
4. User receives welcome email (if configured)

## Post-Creation Tasks

### User Onboarding
1. **Send Credentials**: Provide login details securely
2. **Initial Training**: System orientation
3. **Role Explanation**: Clarify responsibilities
4. **First Login**: Assist with password change

### Account Verification
- Verify user can log in successfully
- Check role permissions are working
- Test access to assigned features
- Confirm email notifications work

### Documentation
- Record user creation in admin logs
- Update user directory
- Maintain role assignment records
- Document any custom permissions

## Best Practices

### Security
- Use strong temporary passwords
- Force password change on first login
- Verify user identity before account creation
- Regular security training for new users

### Role Assignment
- Follow principle of least privilege
- Assign minimum required access
- Regular role reviews and updates
- Clear role documentation

### Communication
- Clear communication of responsibilities
- Provide user guides and training
- Establish support channels
- Regular check-ins with new users

## Troubleshooting

### Common Issues
- **Email Already Exists**: Use different email address
- **Weak Password**: Strengthen password requirements
- **Permission Errors**: Check admin privileges
- **Email Delivery**: Verify email configuration

### Solutions
- Verify all required fields are filled
- Check network connectivity
- Confirm admin permissions
- Contact system administrator if needed
      `
    },

    'categories-brands': {
      title: 'Categories & Brands Management',
      content: `
# Categories & Brands Management

Organize your inventory efficiently with proper categorization and brand management.

## Product Categories

### Creating Categories
1. Navigate to Inventory → Categories
2. Click "Add New Category" button
3. Enter category details:
   - Category Name (e.g., "Fertilizers")
   - Description
   - Parent Category (if subcategory)
   - Status (Active/Inactive)

### Category Hierarchy
- **Main Categories**: Fertilizers, Seeds, Pesticides, Tools
- **Subcategories**: Organic Fertilizers, Chemical Fertilizers
- **Sub-subcategories**: NPK Fertilizers, Urea Fertilizers

### Best Practices
- Use clear, descriptive names
- Maintain consistent naming conventions
- Limit hierarchy depth to 3-4 levels
- Regular category cleanup and organization

## Brand Management

### Adding Brands
1. Go to Inventory → Brands
2. Click "Add New Brand"
3. Fill in brand information:
   - Brand Name (e.g., "IFFCO")
   - Brand Code (optional)
   - Description
   - Contact Information
   - Status

### Brand Organization
- Maintain accurate brand information
- Include supplier contact details
- Track brand performance metrics
- Regular brand database updates

## Category & Brand Assignment

### Product Assignment
- Assign each product to appropriate category
- Select correct brand during product creation
- Use bulk assignment for multiple products
- Maintain consistency across similar products

### Reporting Benefits
- Category-wise sales analysis
- Brand performance tracking
- Inventory organization
- Better search and filtering

✅ **Tip**: Well-organized categories and brands improve inventory management efficiency and reporting accuracy.
      `
    },

    'bulk-operations': {
      title: 'Bulk Operations',
      content: `
# Bulk Operations

Efficiently manage large quantities of data with bulk operations in KrishiSethu.

## Bulk Product Import

### CSV Import Process
1. Download the product template
2. Fill in product details in Excel/CSV
3. Navigate to Inventory → Bulk Import
4. Upload your CSV file
5. Review and confirm import

### CSV Format Requirements
- Product Name (required)
- Category (required)
- Brand (required)
- Purchase Price (required)
- Selling Price (required)
- Stock Quantity
- Minimum Stock Level
- Unit of Measurement

### Import Validation
- System validates all required fields
- Checks for duplicate products
- Verifies category and brand existence
- Reports any errors before import

## Bulk Price Updates

### Price Update Process
1. Go to Inventory → Bulk Operations
2. Select "Price Update" option
3. Choose products by category or brand
4. Set new prices or percentage changes
5. Review and apply changes

### Update Options
- Fixed price increase/decrease
- Percentage-based adjustments
- Category-wise price updates
- Brand-specific pricing changes

## Bulk Stock Adjustments

### Stock Adjustment Types
- **Stock In**: Adding inventory
- **Stock Out**: Removing inventory
- **Stock Transfer**: Moving between locations
- **Stock Correction**: Fixing discrepancies

### Adjustment Process
1. Navigate to Inventory → Stock Adjustments
2. Select "Bulk Adjustment"
3. Choose adjustment type
4. Upload adjustment file or select products
5. Enter quantities and reasons
6. Submit for processing

## Bulk Export Operations

### Export Options
- Product catalog export
- Stock level reports
- Sales data export
- Customer information export

### Export Formats
- CSV for Excel compatibility
- PDF for printing
- JSON for system integration
- XML for data exchange

## Best Practices

### Data Preparation
- Always backup before bulk operations
- Validate data in small batches first
- Use consistent formatting
- Double-check calculations

### Error Handling
- Review error reports carefully
- Fix issues before retrying
- Keep original files as backup
- Document changes made

✅ **Important**: Always test bulk operations with a small dataset before processing large quantities.
      `
    },

    'payment-methods': {
      title: 'Payment Methods',
      content: `
# Payment Methods

Configure and manage various payment options for your customers.

## Available Payment Methods

### Cash Payments
- Default payment method
- Immediate transaction completion
- No additional setup required
- Automatic cash drawer integration

### Digital Payments
- UPI payments (PhonePe, Google Pay, Paytm)
- Credit/Debit card processing
- Net banking integration
- Digital wallet support

### Credit Sales
- Customer credit accounts
- Credit limit management
- Payment due tracking
- Credit history maintenance

## Setting Up Payment Methods

### Cash Configuration
1. Navigate to Settings → Payment Methods
2. Ensure "Cash" is enabled
3. Configure cash denominations
4. Set cash drawer settings

### Digital Payment Setup
1. Go to Settings → Payment Methods
2. Click "Add Payment Method"
3. Select payment provider
4. Enter merchant credentials
5. Test payment integration

### Credit Sales Setup
1. Enable credit sales feature
2. Set default credit terms
3. Configure credit limits
4. Set up payment reminders

## Processing Payments

### Cash Transactions
1. Select products in POS
2. Choose "Cash" payment method
3. Enter amount received
4. System calculates change
5. Print receipt

### Digital Payments
1. Complete product selection
2. Choose digital payment method
3. Enter payment amount
4. Customer completes payment
5. Verify transaction success

### Credit Sales
1. Select customer account
2. Choose "Credit" payment method
3. Verify credit limit availability
4. Complete sale on credit
5. Update customer balance

## Payment Reporting

### Daily Cash Reports
- Opening cash balance
- Total cash sales
- Cash payments received
- Closing cash balance

### Digital Payment Reports
- Transaction success rates
- Payment method breakdown
- Processing fees summary
- Settlement reports

### Credit Reports
- Outstanding credit balances
- Overdue payments
- Credit utilization
- Payment collection reports

✅ **Best Practice**: Regularly reconcile all payment methods to ensure accurate financial records.
      `
    },

    'discounts-offers': {
      title: 'Discounts & Offers',
      content: `
# Discounts & Offers

Create and manage promotional campaigns to boost sales and customer loyalty.

## Types of Discounts

### Percentage Discounts
- Fixed percentage off (e.g., 10% off)
- Applicable to individual items or entire bill
- Easy to understand for customers
- Automatic calculation in POS

### Fixed Amount Discounts
- Specific rupee amount off (e.g., ₹50 off)
- Minimum purchase requirements
- Bulk purchase incentives
- Seasonal promotions

### Buy One Get One (BOGO)
- Buy 1 Get 1 Free offers
- Buy 2 Get 1 Free promotions
- Mix and match deals
- Category-specific offers

## Creating Discount Rules

### Setting Up Discounts
1. Navigate to Sales → Discounts & Offers
2. Click "Create New Discount"
3. Choose discount type
4. Set discount parameters
5. Define validity period

### Discount Parameters
- **Discount Name**: Clear, descriptive name
- **Discount Type**: Percentage, Fixed, or BOGO
- **Discount Value**: Amount or percentage
- **Minimum Purchase**: Required minimum amount
- **Maximum Discount**: Cap on discount amount
- **Valid From/To**: Start and end dates

### Product/Category Selection
- Apply to specific products
- Apply to entire categories
- Exclude certain items
- Brand-specific discounts

## Customer-Specific Offers

### Loyalty Discounts
- Regular customer discounts
- Volume-based pricing
- Membership tier benefits
- Birthday/anniversary offers

### Credit Customer Benefits
- Extended payment terms
- Special pricing tiers
- Bulk purchase discounts
- Seasonal credit offers

## Promotional Campaigns

### Seasonal Offers
- Festival season discounts
- Harvest season promotions
- End-of-season clearance
- New product launches

### Bulk Purchase Incentives
- Quantity-based discounts
- Farmer group discounts
- Cooperative society offers
- Wholesale pricing tiers

## Managing Active Offers

### Monitoring Performance
- Track discount usage
- Monitor sales impact
- Analyze customer response
- Measure profitability

### Offer Modifications
- Update discount percentages
- Extend validity periods
- Add/remove products
- Adjust minimum requirements

✅ **Strategy Tip**: Use data analytics to identify the most effective discount strategies for your customer base.
      `
    },

    'receipt-printing': {
      title: 'Receipt Printing',
      content: `
# Receipt Printing

Configure and manage receipt printing for professional customer service.

## Printer Setup

### Thermal Printer Configuration
1. Connect thermal printer via USB or Bluetooth
2. Install printer drivers
3. Navigate to Settings → Printer Settings
4. Select your printer model
5. Test print functionality

### Receipt Format Settings
- Company logo and details
- Receipt header information
- Product line item format
- Tax calculation display
- Footer messages and terms

## Receipt Customization

### Header Information
- Shop name and address
- Contact details (phone, email)
- GST registration number
- Receipt number and date/time

### Product Details
- Product name and description
- Quantity and unit price
- Discount applied (if any)
- Line total amount
- Tax breakdown

### Footer Information
- Total amount and payment method
- Change given (for cash payments)
- Thank you message
- Return policy information

## Printing Options

### Automatic Printing
- Print receipt after each sale
- Duplicate receipt option
- Email receipt to customer
- SMS receipt notification

### Manual Printing
- Reprint previous receipts
- Print receipt on demand
- Batch printing for multiple sales
- Custom receipt formats

## Receipt Management

### Receipt History
- View all printed receipts
- Search by receipt number or date
- Reprint any previous receipt
- Export receipt data

### Digital Receipts
- Email receipts to customers
- SMS receipt delivery
- WhatsApp receipt sharing
- PDF receipt generation

## Troubleshooting

### Common Printing Issues
- Printer not responding
- Poor print quality
- Paper jam problems
- Connectivity issues

### Solutions
- Check printer connections
- Replace thermal paper
- Clean printer head
- Update printer drivers
- Restart printer and system

✅ **Professional Tip**: Always keep spare thermal paper rolls and maintain your printer regularly for consistent performance.
      `
    },

    'customer-database': {
      title: 'Customer Database',
      content: `
# Customer Database

Maintain comprehensive customer information for better service and business insights.

## Customer Information Management

### Basic Customer Details
- Full name and contact information
- Address and location details
- Phone numbers and email addresses
- Customer type (Individual/Business)
- Registration date and status

### Business Customers
- Company name and registration
- GST number and tax details
- Credit terms and payment history
- Authorized contact persons
- Business category and size

## Adding New Customers

### Quick Customer Addition
1. In POS, click "Add Customer"
2. Enter basic details (name, phone)
3. Save and continue with sale
4. Complete details later if needed

### Detailed Customer Profile
1. Navigate to Customers → Add Customer
2. Fill comprehensive customer form
3. Add address and contact details
4. Set credit limits and terms
5. Save customer profile

## Customer Categories

### Individual Customers
- Retail customers
- Walk-in customers
- Regular customers
- Loyalty program members

### Business Customers
- Wholesale customers
- Dealer networks
- Cooperative societies
- Government institutions

## Customer Search and Management

### Search Options
- Search by name or phone number
- Filter by customer type
- Sort by registration date
- View by location or area

### Customer Actions
- View purchase history
- Update contact information
- Manage credit accounts
- Send promotional messages

## Customer Analytics

### Purchase Behavior
- Buying patterns and preferences
- Seasonal purchase trends
- Average order value
- Purchase frequency

### Customer Segmentation
- High-value customers
- Regular customers
- Occasional buyers
- Inactive customers

## Customer Communication

### Automated Messages
- Birthday and anniversary wishes
- Payment due reminders
- New product announcements
- Seasonal offers and promotions

### Manual Communication
- Bulk SMS campaigns
- Email newsletters
- WhatsApp broadcasts
- Phone call reminders

✅ **Relationship Building**: Use customer data to provide personalized service and build long-term relationships.
      `
    },

    'sales-history': {
      title: 'Sales History',
      content: `
# Sales History

Track and analyze all sales transactions for business insights and customer service.

## Viewing Sales History

### Sales Transaction List
1. Navigate to Sales → Sales History
2. View chronological list of all sales
3. Use filters to narrow down results
4. Export data for external analysis

### Transaction Details
- Sale date and time
- Customer information
- Products sold and quantities
- Payment method used
- Total amount and taxes
- Discount applied

## Search and Filter Options

### Date Range Filters
- Today's sales
- This week/month/year
- Custom date ranges
- Specific date selection

### Customer Filters
- Sales by specific customer
- Customer type (retail/wholesale)
- New vs returning customers
- Customer location/area

### Product Filters
- Sales by product category
- Brand-wise sales analysis
- Top-selling products
- Slow-moving inventory

## Sales Analytics

### Performance Metrics
- Daily/weekly/monthly sales totals
- Average transaction value
- Number of transactions
- Peak sales hours/days

### Trend Analysis
- Sales growth patterns
- Seasonal variations
- Product performance trends
- Customer buying behavior

## Customer Purchase History

### Individual Customer View
- Complete purchase history
- Favorite products
- Purchase frequency
- Total spending amount

### Customer Insights
- Buying patterns
- Preferred payment methods
- Seasonal preferences
- Credit payment history

## Sales Reporting

### Standard Reports
- Daily sales summary
- Monthly sales report
- Product-wise sales
- Customer-wise sales

### Custom Reports
- Create custom date ranges
- Select specific metrics
- Choose report format
- Schedule automated reports

## Transaction Management

### Receipt Reprinting
- Reprint any previous receipt
- Email receipt to customer
- Generate PDF copies
- Bulk receipt printing

### Sale Modifications
- View original sale details
- Process returns if applicable
- Apply additional discounts
- Update customer information

✅ **Business Intelligence**: Regular analysis of sales history helps identify opportunities for growth and improvement.
      `
    },

    'sales-reports': {
      title: 'Sales Reports',
      content: `
# Sales Reports

Generate comprehensive sales reports for business analysis and decision making.

## Report Types

### Daily Sales Reports
- Total sales amount
- Number of transactions
- Payment method breakdown
- Top-selling products
- Hourly sales distribution

### Monthly Sales Reports
- Month-over-month comparison
- Category-wise performance
- Customer acquisition metrics
- Profit margin analysis
- Seasonal trends

### Annual Sales Reports
- Yearly growth analysis
- Product performance review
- Customer retention rates
- Market trend analysis
- Financial performance summary

## Generating Reports

### Quick Reports
1. Navigate to Reports → Sales Reports
2. Select report type
3. Choose date range
4. Click "Generate Report"
5. View or download results

### Custom Reports
1. Go to Reports → Custom Reports
2. Select data fields
3. Set filters and conditions
4. Choose visualization type
5. Save report template

## Report Formats

### Visual Reports
- Charts and graphs
- Pie charts for categories
- Line graphs for trends
- Bar charts for comparisons
- Dashboard summaries

### Detailed Reports
- Tabular data format
- Transaction-level details
- Customer-wise breakdown
- Product-wise analysis
- Export to Excel/PDF

## Key Performance Indicators

### Sales Metrics
- Total revenue
- Average order value
- Sales growth rate
- Conversion rates
- Customer lifetime value

### Product Metrics
- Best-selling products
- Profit margins by product
- Inventory turnover
- Stock movement analysis
- Category performance

## Report Scheduling

### Automated Reports
- Daily sales summaries
- Weekly performance reports
- Monthly business reviews
- Quarterly analysis
- Annual reports

### Report Distribution
- Email to stakeholders
- SMS notifications
- Dashboard updates
- Printed reports
- Cloud storage backup

## Data Analysis

### Trend Identification
- Seasonal patterns
- Growth opportunities
- Market changes
- Customer behavior shifts
- Product lifecycle stages

### Business Insights
- Revenue optimization
- Cost reduction opportunities
- Customer segmentation
- Market expansion potential
- Operational efficiency

✅ **Strategic Planning**: Use sales reports to make data-driven decisions and plan future business strategies.
      `
    },

    'inventory-reports': {
      title: 'Inventory Reports',
      content: `
# Inventory Reports

Monitor and analyze your inventory levels, movements, and valuation.

## Stock Level Reports

### Current Stock Report
- Product-wise current stock
- Stock value at cost price
- Stock value at selling price
- Low stock alerts
- Out-of-stock items

### Stock Movement Report
- Stock in/out transactions
- Date-wise movement history
- Reason for stock adjustments
- User who made changes
- Running stock balance

## Valuation Reports

### Inventory Valuation
- Total inventory value
- Category-wise valuation
- Brand-wise stock value
- Cost vs selling price analysis
- Profit potential calculation

### Dead Stock Analysis
- Slow-moving products
- Zero-movement items
- Aging analysis
- Clearance recommendations
- Write-off suggestions

## Performance Reports

### ABC Analysis
- A-category: High-value items
- B-category: Medium-value items
- C-category: Low-value items
- Movement frequency analysis
- Investment optimization

### Turnover Reports
- Inventory turnover ratio
- Days sales outstanding
- Fast-moving products
- Seasonal movement patterns
- Reorder recommendations

## Stock Alerts

### Low Stock Alerts
- Items below minimum level
- Automatic reorder suggestions
- Supplier contact information
- Lead time considerations
- Seasonal demand factors

### Overstock Alerts
- Items with excess inventory
- Slow-moving stock identification
- Storage cost implications
- Discount recommendations
- Supplier return options

## Reporting Features

### Customizable Reports
- Select specific products/categories
- Choose date ranges
- Filter by stock levels
- Sort by various criteria
- Export in multiple formats

### Scheduled Reports
- Daily stock summaries
- Weekly movement reports
- Monthly valuation reports
- Quarterly analysis
- Annual inventory review

✅ **Inventory Optimization**: Use these reports to maintain optimal stock levels and maximize profitability.
      `
    },

    'financial-reports': {
      title: 'Financial Reports',
      content: `
# Financial Reports

Generate comprehensive financial reports for business analysis and compliance.

## Profit & Loss Reports

### Revenue Analysis
- Total sales revenue
- Category-wise revenue
- Monthly/quarterly trends
- Year-over-year comparison
- Revenue growth analysis

### Cost Analysis
- Cost of goods sold (COGS)
- Operating expenses
- Purchase costs
- Overhead expenses
- Cost breakdown by category

### Profit Calculation
- Gross profit margins
- Net profit analysis
- Product-wise profitability
- Customer-wise profit
- Profit trend analysis

## Cash Flow Reports

### Cash Inflows
- Sales receipts
- Customer payments
- Other income sources
- Payment method breakdown
- Collection efficiency

### Cash Outflows
- Supplier payments
- Operating expenses
- Purchase payments
- Other expenditures
- Payment timing analysis

## Tax Reports

### GST Reports
- GST collected on sales
- GST paid on purchases
- Input tax credit
- GST liability calculation
- Monthly GST returns

### Tax Compliance
- TDS calculations
- Professional tax
- Other statutory taxes
- Tax payment schedules
- Compliance deadlines

## Customer Financial Reports

### Accounts Receivable
- Outstanding customer balances
- Aging analysis
- Collection reports
- Credit limit utilization
- Payment history

### Credit Management
- Credit sales analysis
- Payment due dates
- Overdue accounts
- Collection efficiency
- Bad debt provisions

## Supplier Financial Reports

### Accounts Payable
- Outstanding supplier balances
- Payment due analysis
- Supplier-wise payables
- Payment scheduling
- Early payment discounts

### Purchase Analysis
- Supplier-wise purchases
- Payment terms analysis
- Purchase trends
- Cost optimization opportunities
- Supplier performance metrics

## Financial Dashboard

### Key Metrics
- Daily cash position
- Monthly profit/loss
- Outstanding receivables
- Pending payables
- Financial ratios

### Performance Indicators
- Gross margin percentage
- Net profit margin
- Return on investment
- Cash conversion cycle
- Working capital ratio

✅ **Financial Health**: Regular financial reporting helps maintain business profitability and cash flow management.
      `
    },

    'system-requirements': {
      title: 'System Requirements',
      content: `
# System Requirements

Ensure your system meets the minimum requirements for optimal KrishiSethu performance.

## Hardware Requirements

### Minimum Requirements
- **Processor**: Intel Core i3 or AMD equivalent
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 10GB free disk space
- **Display**: 1024x768 resolution minimum
- **Network**: Stable internet connection

### Recommended Requirements
- **Processor**: Intel Core i5 or AMD equivalent
- **RAM**: 8GB or higher
- **Storage**: 20GB free disk space (SSD preferred)
- **Display**: 1920x1080 resolution
- **Network**: Broadband internet connection

## Software Requirements

### Operating System
- **Windows**: Windows 10 or later
- **macOS**: macOS 10.14 or later
- **Linux**: Ubuntu 18.04 or equivalent

### Web Browser
- **Chrome**: Version 90 or later (Recommended)
- **Firefox**: Version 88 or later
- **Safari**: Version 14 or later
- **Edge**: Version 90 or later

## Network Requirements

### Internet Connection
- **Minimum**: 2 Mbps download speed
- **Recommended**: 10 Mbps or higher
- **Latency**: Less than 100ms
- **Reliability**: 99% uptime preferred

### Network Configuration
- Open ports for application access
- Firewall configuration for cloud sync
- VPN compatibility if required
- Local network setup for multiple users

## Peripheral Requirements

### Printer Support
- **Thermal Printers**: 58mm/80mm thermal printers
- **Inkjet/Laser**: Standard A4 printers
- **Connectivity**: USB, Bluetooth, or Network
- **Drivers**: Latest printer drivers installed

### Barcode Scanner
- **Type**: USB or Bluetooth barcode scanners
- **Compatibility**: Standard barcode formats
- **Range**: 1D and 2D barcode support
- **Integration**: Plug-and-play preferred

### Cash Drawer
- **Type**: Electronic cash drawer
- **Connectivity**: RJ11/RJ12 connection
- **Compatibility**: Standard POS cash drawers
- **Integration**: Automatic opening support

## Mobile Requirements

### Android Devices
- **OS Version**: Android 8.0 or later
- **RAM**: 3GB minimum
- **Storage**: 2GB free space
- **Screen**: 5-inch minimum display

### iOS Devices
- **OS Version**: iOS 12.0 or later
- **Device**: iPhone 7 or later, iPad Air 2 or later
- **Storage**: 2GB free space
- **Network**: Wi-Fi or cellular data

## Performance Optimization

### System Optimization
- Regular system updates
- Antivirus software with exclusions
- Disk cleanup and defragmentation
- Background application management

### Network Optimization
- Quality of Service (QoS) configuration
- Bandwidth allocation
- Network monitoring
- Backup internet connection

✅ **Performance Tip**: Meeting recommended requirements ensures smooth operation and better user experience.
      `
    },

    'backup-security': {
      title: 'Backup & Security',
      content: `
# Backup & Security

Protect your business data with comprehensive backup and security measures.

## Data Backup

### Automatic Backups
- **Cloud Backup**: Automatic daily backups to secure cloud storage
- **Local Backup**: Regular backups to local storage devices
- **Real-time Sync**: Continuous data synchronization
- **Backup Scheduling**: Customizable backup frequency

### Backup Types
- **Full Backup**: Complete system and data backup
- **Incremental Backup**: Only changed data since last backup
- **Differential Backup**: Changes since last full backup
- **Database Backup**: Specific database backups

### Backup Verification
- Regular backup integrity checks
- Test restore procedures
- Backup completion notifications
- Error reporting and alerts

## Data Security

### User Authentication
- **Strong Passwords**: Minimum 8 characters with complexity
- **Two-Factor Authentication**: Additional security layer
- **Session Management**: Automatic logout after inactivity
- **Login Monitoring**: Track login attempts and failures

### Data Encryption
- **Data at Rest**: Encrypted database storage
- **Data in Transit**: SSL/TLS encryption for data transfer
- **Backup Encryption**: Encrypted backup files
- **Key Management**: Secure encryption key handling

## Access Control

### User Permissions
- **Role-Based Access**: Permissions based on user roles
- **Feature Restrictions**: Limit access to specific features
- **Data Visibility**: Control what data users can see
- **Action Logging**: Track all user actions

### System Security
- **Firewall Protection**: Network security measures
- **Antivirus Integration**: Malware protection
- **Security Updates**: Regular system updates
- **Vulnerability Scanning**: Periodic security assessments

## Disaster Recovery

### Recovery Planning
- **Recovery Time Objective (RTO)**: Target recovery time
- **Recovery Point Objective (RPO)**: Acceptable data loss
- **Business Continuity**: Minimal business disruption
- **Communication Plan**: Stakeholder notification procedures

### Recovery Procedures
- **Data Restoration**: Step-by-step recovery process
- **System Recovery**: Complete system restoration
- **Partial Recovery**: Selective data recovery
- **Testing**: Regular recovery testing

## Compliance & Audit

### Data Protection
- **Privacy Compliance**: GDPR and local privacy laws
- **Data Retention**: Appropriate data retention policies
- **Data Disposal**: Secure data deletion procedures
- **Audit Trails**: Comprehensive activity logging

### Security Monitoring
- **Activity Monitoring**: Real-time system monitoring
- **Anomaly Detection**: Unusual activity alerts
- **Security Reports**: Regular security assessments
- **Incident Response**: Security incident procedures

## Best Practices

### Daily Security Tasks
- Monitor backup completion
- Review security alerts
- Check system updates
- Verify user access logs

### Weekly Security Tasks
- Test backup restoration
- Review user permissions
- Update security policies
- Conduct security training

### Monthly Security Tasks
- Full security assessment
- Update disaster recovery plan
- Review compliance requirements
- Security policy updates

✅ **Security First**: Regular backup and security maintenance protects your business from data loss and security threats.
      `
    }
  };

  const documentationSections = {
    'getting-started': {
      title: 'Getting Started',
      icon: <Play className="h-5 w-5" />,
      items: [
        {
          id: 'quick-start',
          title: 'Quick Start Guide',
          description: 'Get up and running with your inventory system in 5 minutes',
          type: 'guide',
          duration: '5 min read',
          topics: ['Initial Setup', 'First Product Entry', 'Basic Navigation']
        },
        {
          id: 'system-overview',
          title: 'System Overview',
          description: 'Understanding the main features and modules',
          type: 'overview',
          duration: '10 min read',
          topics: ['Dashboard', 'Inventory Management', 'POS System', 'Reports']
        },
        {
          id: 'user-roles',
          title: 'User Roles & Permissions',
          description: 'Learn about different user types and access levels',
          type: 'guide',
          duration: '7 min read',
          topics: ['Admin Users', 'Staff Users', 'Permissions', 'Security']
        }
      ]
    },
    'inventory': {
      title: 'Inventory Management',
      icon: <Package className="h-5 w-5" />,
      items: [
        {
          id: 'adding-products',
          title: 'Adding Products',
          description: 'How to add fertilizers, seeds, and pesticides to your inventory',
          type: 'tutorial',
          duration: '8 min read',
          topics: ['Product Details', 'Categories', 'Brands', 'Stock Levels', 'Pricing']
        },
        {
          id: 'stock-management',
          title: 'Stock Management',
          description: 'Managing stock levels, movements, and alerts',
          type: 'guide',
          duration: '12 min read',
          topics: ['Stock Tracking', 'Low Stock Alerts', 'Stock Movements', 'Adjustments']
        },
        {
          id: 'categories-brands',
          title: 'Categories & Brands',
          description: 'Organizing your products with categories and brands',
          type: 'tutorial',
          duration: '6 min read',
          topics: ['Creating Categories', 'Managing Brands', 'Product Organization']
        },
        {
          id: 'bulk-operations',
          title: 'Bulk Operations',
          description: 'Import/export products and bulk updates',
          type: 'advanced',
          duration: '15 min read',
          topics: ['CSV Import', 'Bulk Updates', 'Data Export', 'Templates']
        }
      ]
    },
    'pos': {
      title: 'Point of Sale (POS)',
      icon: <ShoppingCart className="h-5 w-5" />,
      items: [
        {
          id: 'making-sales',
          title: 'Making Sales',
          description: 'Complete guide to processing sales transactions',
          type: 'tutorial',
          duration: '10 min read',
          topics: ['Adding Items', 'Customer Info', 'Payment Processing', 'Receipts']
        },
        {
          id: 'payment-methods',
          title: 'Payment Methods',
          description: 'Accepting cash, card, and UPI payments',
          type: 'guide',
          duration: '8 min read',
          topics: ['Cash Payments', 'Card Payments', 'UPI Payments', 'Split Payments']
        },
        {
          id: 'discounts-offers',
          title: 'Discounts & Offers',
          description: 'Applying discounts and managing promotional offers',
          type: 'tutorial',
          duration: '7 min read',
          topics: ['Percentage Discounts', 'Fixed Amount', 'Customer Discounts']
        },
        {
          id: 'receipt-printing',
          title: 'Receipt Printing',
          description: 'Setting up thermal printers and receipt formats',
          type: 'technical',
          duration: '12 min read',
          topics: ['Thermal Printers', 'Receipt Templates', 'Print Settings']
        }
      ]
    },
    'orders': {
      title: 'Orders & Purchasing',
      icon: <Truck className="h-5 w-5" />,
      items: [
        {
          id: 'purchase-orders',
          title: 'Purchase Orders',
          description: 'Creating and managing purchase orders from suppliers',
          type: 'tutorial',
          duration: '12 min read',
          topics: ['Creating Orders', 'Order Tracking', 'Supplier Management', 'Order Status']
        },
        {
          id: 'supplier-management',
          title: 'Supplier Management',
          description: 'Managing supplier information and relationships',
          type: 'guide',
          duration: '8 min read',
          topics: ['Supplier Profiles', 'Contact Management', 'Order History', 'Performance Tracking']
        },
        {
          id: 'purchase-entry',
          title: 'Purchase Entry',
          description: 'Recording incoming stock and purchase transactions',
          type: 'tutorial',
          duration: '10 min read',
          topics: ['Stock Receiving', 'Purchase Recording', 'Inventory Updates', 'Cost Tracking']
        },
        {
          id: 'order-tracking',
          title: 'Order Tracking',
          description: 'Monitoring order status and delivery schedules',
          type: 'guide',
          duration: '7 min read',
          topics: ['Order Status', 'Delivery Tracking', 'Payment Status', 'Order Reports']
        }
      ]
    },
    'customers': {
      title: 'Customer Management',
      icon: <Users className="h-5 w-5" />,
      items: [
        {
          id: 'customer-database',
          title: 'Customer Database',
          description: 'Managing customer information and history',
          type: 'guide',
          duration: '9 min read',
          topics: ['Customer Profiles', 'Contact Info', 'Purchase History']
        },
        {
          id: 'sales-history',
          title: 'Sales History',
          description: 'Tracking customer purchases and preferences',
          type: 'tutorial',
          duration: '6 min read',
          topics: ['Transaction History', 'Customer Analytics', 'Repeat Customers']
        }
      ]
    },
    'reports': {
      title: 'Reports & Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      items: [
        {
          id: 'sales-reports',
          title: 'Sales Reports',
          description: 'Generate and analyze sales performance reports',
          type: 'guide',
          duration: '11 min read',
          topics: ['Daily Sales', 'Monthly Reports', 'Product Performance', 'Trends']
        },
        {
          id: 'inventory-reports',
          title: 'Inventory Reports',
          description: 'Stock reports and inventory analytics',
          type: 'tutorial',
          duration: '9 min read',
          topics: ['Stock Levels', 'Movement Reports', 'Valuation', 'Aging Analysis']
        },
        {
          id: 'financial-reports',
          title: 'Financial Reports',
          description: 'Revenue, profit, and financial analytics',
          type: 'advanced',
          duration: '13 min read',
          topics: ['Revenue Analysis', 'Profit Margins', 'Tax Reports', 'GST Compliance']
        }
      ]
    },
    'technical': {
      title: 'Technical Setup',
      icon: <Settings className="h-5 w-5" />,
      items: [
        {
          id: 'system-requirements',
          title: 'System Requirements',
          description: 'Hardware and software requirements for optimal performance',
          type: 'technical',
          duration: '5 min read',
          topics: ['Hardware Specs', 'Browser Support', 'Network Requirements']
        },
        {
          id: 'backup-security',
          title: 'Backup & Security',
          description: 'Data backup procedures and security best practices',
          type: 'technical',
          duration: '14 min read',
          topics: ['Data Backup', 'User Security', 'Access Control', 'Data Recovery']
        },
        {
          id: 'troubleshooting',
          title: 'Troubleshooting',
          description: 'Common issues and their solutions',
          type: 'reference',
          duration: '20 min read',
          topics: ['Login Issues', 'Print Problems', 'Network Issues', 'Performance']
        }
      ]
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'tutorial': return 'bg-blue-100 text-blue-800';
      case 'guide': return 'bg-green-100 text-green-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'technical': return 'bg-orange-100 text-orange-800';
      case 'reference': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'tutorial': return <Play className="h-4 w-4" />;
      case 'guide': return <BookOpen className="h-4 w-4" />;
      case 'advanced': return <Lightbulb className="h-4 w-4" />;
      case 'technical': return <Settings className="h-4 w-4" />;
      case 'reference': return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const handleGuideClick = (guideId) => {
    setSelectedGuide(guideId);
  };

  const handleBackToList = () => {
    setSelectedGuide(null);
  };

  const handleDownloadPDF = () => {
    // Simple PDF generation using browser print
    window.print();
  };

  const handlePrintGuide = () => {
    window.print();
  };

  const handleOnlineHelp = () => {
    // Open external help or support page
    window.open('mailto:support@krishisethu.com?subject=Help Request', '_blank');
  };

  const renderMarkdownContent = (content) => {
    // Simple markdown-like rendering
    return content.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold mb-4 text-gray-900">{line.substring(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-semibold mb-3 mt-6 text-gray-800">{line.substring(3)}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-medium mb-2 mt-4 text-gray-700">{line.substring(4)}</h3>;
      } else if (line.startsWith('#### ')) {
        return <h4 key={index} className="text-lg font-medium mb-2 mt-3 text-gray-600">{line.substring(5)}</h4>;
      } else if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 mb-1 text-gray-700">{line.substring(2)}</li>;
      } else if (line.trim().match(/^\d+\./)) {
        return <li key={index} className="ml-4 mb-1 text-gray-700 list-decimal">{line.trim()}</li>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else if (line.startsWith('🎉') || line.startsWith('⚠️') || line.startsWith('✅')) {
        return <p key={index} className="mb-2 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded">{line}</p>;
      } else {
        return <p key={index} className="mb-2 text-gray-700 leading-relaxed">{line}</p>;
      }
    });
  };

  const filteredSections = Object.entries(documentationSections).reduce((acc, [key, section]) => {
    if (searchTerm) {
      const filteredItems = section.items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      if (filteredItems.length > 0) {
        acc[key] = { ...section, items: filteredItems };
      }
    } else {
      acc[key] = section;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-semibold">Documentation</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleOnlineHelp}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Online Help
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-card border-r min-h-screen p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {Object.entries(filteredSections).map(([key, section]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedCategory === key
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {section.icon}
                  <span className="font-medium">{section.title}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {section.items.length}
                  </Badge>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {selectedGuide ? (
            // Show individual guide content
            <div className="max-w-4xl">
              <div className="flex items-center space-x-4 mb-6">
                <Button variant="outline" size="sm" onClick={handleBackToList}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Guides
                </Button>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Home className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4" />
                  <span>{filteredSections[selectedCategory]?.title}</span>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-gray-900">{documentationContent[selectedGuide]?.title}</span>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-8 prose prose-lg max-w-none">
                {documentationContent[selectedGuide] ? (
                  renderMarkdownContent(documentationContent[selectedGuide].content)
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Content Coming Soon</h3>
                    <p className="text-gray-600">
                      This guide is being prepared and will be available soon.
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handleBackToList}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Guide List
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrintGuide}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Guide
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Show guide list
            selectedCategory && filteredSections[selectedCategory] && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    {filteredSections[selectedCategory].title}
                  </h2>
                  <p className="text-gray-600">
                    Comprehensive guides and tutorials for {filteredSections[selectedCategory].title.toLowerCase()}
                  </p>
                </div>

                <div className="grid gap-6">
                  {filteredSections[selectedCategory].items.map((item, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleGuideClick(item.id)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {getTypeIcon(item.type)}
                            <div>
                              <CardTitle className="text-xl">{item.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {item.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getTypeColor(item.type)}>
                              {item.type}
                            </Badge>
                            <Badge variant="outline">
                              {item.duration}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Topics Covered:</h4>
                            <div className="flex flex-wrap gap-2">
                              {item.topics.map((topic, topicIndex) => (
                                <Badge key={topicIndex} variant="secondary" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <FileText className="h-4 w-4" />
                                <span>Article</span>
                              </span>
                              {documentationContent[item.id] && (
                                <span className="flex items-center space-x-1 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Available</span>
                                </span>
                              )}
                            </div>
                            <Button size="sm">
                              Read Guide
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Documentation;
