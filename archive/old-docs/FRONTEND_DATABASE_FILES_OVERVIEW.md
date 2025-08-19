# Frontend Database Files Overview
**Generated**: $(date)
**Purpose**: Complete overview of all frontend database interaction files

## 📁 File Structure

```
src/
├── lib/
│   ├── supabase.js                 # Main Supabase client & helpers
│   ├── supabaseDb.js              # Database service layer (1344 lines)
│   ├── database-setup.js          # Database initialization
│   └── supabase-fixed.js          # Fixed version of Supabase client
├── hooks/
│   ├── useDatabase.js             # Database connection hook
│   ├── useInventory.js            # Inventory management hook
│   └── useNetworkStatus.js        # Network status monitoring
├── contexts/
│   └── AuthContext.js             # Authentication context
└── components/
    ├── auth/
    │   ├── AuthPage.jsx           # Authentication page
    │   ├── LoginForm.jsx          # Login form with DB queries
    │   └── RegistrationForm.jsx   # Registration with DB operations
    └── DatabaseStatus.jsx         # Database health monitoring
```

---

## 🔧 Core Database Files

### 1. **src/lib/supabase.js** (Main Client)
```javascript
// Configuration
const supabaseUrl = 'https://srhfccodjurgnuvuqynp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// Client with enhanced config
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: true, persistSession: true },
  realtime: { params: { eventsPerSecond: 10 } },
  fetch: (url, options) => fetch(url, { 
    ...options, 
    signal: AbortSignal.timeout(30000) 
  })
})

// Helper Functions Available:
- supabaseQuery.getAll(table)
- supabaseQuery.getById(table, id)
- supabaseQuery.insert(table, record)
- supabaseQuery.update(table, id, updates)
- supabaseQuery.delete(table, id)
- supabaseQuery.search(table, column, searchTerm)
- supabaseQuery.checkTableAccess(tableName)
- supabaseQuery.validateConnection()

// Storage Helpers:
- supabaseStorageHelpers.uploadFile(bucket, path, file)
- supabaseStorageHelpers.getPublicUrl(bucket, path)
- supabaseStorageHelpers.deleteFile(bucket, path)

// Auth Helpers:
- supabaseAuthHelpers.signUp(email, password, metadata)
- supabaseAuthHelpers.signIn(email, password)
- supabaseAuthHelpers.signOut()
- supabaseAuthHelpers.getCurrentUser()

// Diagnostics:
- supabaseDiagnostics.healthCheck()
- supabaseDiagnostics.quickTest()
```

### 2. **src/lib/supabaseDb.js** (Service Layer - 1344 lines)
```javascript
// Collections Mapping
export const COLLECTIONS = {
  USERS: 'users',
  SUPPLIERS: 'suppliers', 
  PRODUCTS: 'products',
  PURCHASES: 'purchases',
  SALES: 'sales',
  CUSTOMERS: 'customers',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  SETTINGS: 'settings',
  STOCK_MOVEMENTS: 'stock_movements'
}

// Field Mappings (camelCase ↔ snake_case)
const fieldMappings = {
  products: {
    toDb: { purchasePrice: 'purchase_price', salePrice: 'sale_price' },
    fromDb: { purchase_price: 'purchasePrice', sale_price: 'salePrice' }
  },
  // ... mappings for all tables
}

// Product Type Resolver
const resolveProductType = (productName, categoryName) => {
  // Maps product names to enum: 'Chemical', 'Organic', 'Bio', 'NPK', 'Seeds', 'Pesticide', 'Tools'
}

// Services Available:
- productsService.getAll()
- productsService.create(productData)
- productsService.update(id, updates)
- productsService.delete(id)
- categoriesService.getAll()
- suppliersService.getAll()
- customersService.getAll()
- salesService.getAll()
- purchasesService.getAll()
- brandsService.getAll()
```

### 3. **src/hooks/useDatabase.js** (Connection Management)
```javascript
export const useDatabase = () => {
  const [status, setStatus] = useState({
    loading: true,
    connected: false,
    healthy: false,
    initialized: false,
    error: null
  })

  // Functions:
  - checkConnection()
  - checkHealth()
  - initializeDatabase()
  - validateSchema()
  - retry()

  // Returns:
  - status, healthData
  - isReady, hasError, needsInitialization
}

export const useDatabaseStatus = () => {
  // UI-friendly status with colors, icons, text
}
```

### 4. **src/hooks/useInventory.js** (Inventory Operations)
```javascript
export const useInventory = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  
  // Functions:
  - loadProducts() // with joins to categories, suppliers
  - loadCategories()
  - addProduct(productData)
  - updateProduct(id, updates)
  - deleteProduct(id)
  - addStockTransaction(productId, type, quantity, notes)
  
  // Returns:
  - products, categories, loading, error, user
  - addProduct, updateProduct, deleteProduct, addStockTransaction, refreshData
}
```

---

## 🔍 Database Table Interactions

### **Products Table**
```javascript
// Frontend expects these fields (camelCase):
{
  id, name, code, type, categoryId, brandId, supplierId,
  description, composition, quantity, unit, minStockLevel,
  reorderPoint, purchasePrice, salePrice, mrp, batchNo,
  expiryDate, manufacturingDate, hsnCode, gstRate,
  barcode, location, imageUrls, isActive, createdAt, updatedAt
}

// Database has these fields (snake_case):
{
  id, name, code, type, category_id, brand_id, supplier_id,
  description, composition, quantity, unit, min_stock_level,
  reorder_point, purchase_price, sale_price, mrp, batch_no,
  expiry_date, manufacturing_date, hsn_code, gst_rate,
  barcode, location, image_urls, is_active, created_at, updated_at
}
```

### **Categories Table**
```javascript
// Frontend: { id, name, description, isActive, sortOrder, createdAt, updatedAt }
// Database: { id, name, description, is_active, sort_order, created_at, updated_at }
```

### **Suppliers Table**
```javascript
// Frontend: { id, name, contactPerson, phone, email, address, gstNumber, paymentTerms, creditLimit, outstandingAmount, isActive }
// Database: { id, name, contact_person, phone, email, address, gst_number, payment_terms, credit_limit, outstanding_amount, is_active }
```

### **Sales Table**
```javascript
// Frontend: { id, saleNumber, customerId, customerName, totalAmount, taxAmount, paymentMethod, amountPaid, paymentStatus, saleDate }
// Database: { id, sale_number, customer_id, customer_name, total_amount, tax_amount, payment_method, amount_paid, payment_status, sale_date }
```

---

## 🔐 Authentication Files

### **src/components/auth/LoginForm.jsx**
```javascript
// Database Operations:
- Check user profile: supabase.from('profiles').select('*').eq('email', email)
- Update last login: supabase.from('profiles').update({ last_login: new Date() })
- Sign in: supabase.auth.signInWithPassword({ email, password })
- Password reset: supabase.auth.resetPasswordForEmail(email)
```

### **src/components/auth/RegistrationForm.jsx**
```javascript
// Database Operations:
- Sign up: supabase.auth.signUp({ email, password })
- Create profile: supabase.from('profiles').insert({ user_id, email, full_name, role })
```

### **src/contexts/AuthContext.js**
```javascript
// Manages authentication state and user session
// Listens to: supabase.auth.onAuthStateChange()
```

---

## 📊 Component Database Usage

### **Dashboard.jsx**
```javascript
import { productsService, salesService, customersService, suppliersService } from '../lib/supabaseDb'

// Loads dashboard data from multiple services
```

### **BulkAddProductTable.jsx**
```javascript
import { productsService, suppliersService, brandsService, categoriesService } from '../lib/supabaseDb'

// Handles bulk product creation with dropdown data loading
```

### **DatabaseStatus.jsx**
```javascript
import { supabaseDiagnostics } from '../lib/supabase'

// Monitors database health and displays status
```

---

## 🔄 Data Flow Architecture

```
Frontend Components
        ↓
    Service Layer (supabaseDb.js)
        ↓
    Supabase Client (supabase.js)
        ↓
    Field Mapping (camelCase ↔ snake_case)
        ↓
    Supabase Database (PostgreSQL)
```

---

## 🚨 Key Issues Found

### **1. Field Mapping Complexity**
- Frontend uses camelCase (purchasePrice)
- Database uses snake_case (purchase_price)
- Requires constant conversion in supabaseDb.js

### **2. Product Type Enum Mismatch**
- Database enum: 'Chemical', 'Organic', 'Bio', 'NPK', 'Seeds', 'Pesticide', 'Tools'
- Frontend may send different values requiring resolveProductType()

### **3. Missing Tables**
- Frontend expects 'notifications' table (not found in DB)
- Frontend expects 'profiles' table for user management

### **4. Empty Critical Tables**
- users table: 0 rows (authentication won't work)
- stock_movements table: 0 rows (no inventory tracking)

---

## 📋 Database Operations Summary

### **Read Operations**
```javascript
// Get all products with relationships
supabase.from('products').select(`
  *, 
  categories(id, name, color),
  suppliers(id, name, email)
`)

// Get categories
supabase.from('categories').select('*').order('name', { ascending: true })
```

### **Write Operations**
```javascript
// Insert product
supabase.from('products').insert([productData]).select()

// Update product
supabase.from('products').update(updates).eq('id', id).select()

// Delete product
supabase.from('products').delete().eq('id', id)
```

### **Authentication Operations**
```javascript
// Sign in
supabase.auth.signInWithPassword({ email, password })

// Get current user
supabase.auth.getUser()

// Sign out
supabase.auth.signOut()
```

---

## 🔧 Configuration Files

### **Environment Variables**
```
DATABASE_URL="postgresql://postgres:AdrianLamo%40143@db.srhfccodjurgnuvuqynp.supabase.co:5432/postgres?sslmode=require"
```

### **Supabase Config**
```javascript
URL: https://srhfccodjurgnuvuqynp.supabase.co
Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📈 Performance Considerations

1. **Connection Timeout**: 30 seconds
2. **Realtime Events**: Limited to 10 per second
3. **Auto-refresh**: Enabled for auth tokens
4. **Session Persistence**: Enabled with localStorage
5. **Field Mapping**: Adds overhead on every DB operation

---

## 🎯 Recommendations

1. **Fix Empty Tables**: Populate users and stock_movements
2. **Create Missing Tables**: Add notifications and profiles tables
3. **Simplify Field Mapping**: Consider using snake_case throughout frontend
4. **Add Error Handling**: More robust error handling in service layer
5. **Optimize Queries**: Add indexes for frequently queried fields
6. **Cache Management**: Implement proper caching for dropdown data

---

*This overview covers all major database interaction files in your frontend. The main complexity lies in the field mapping between camelCase (frontend) and snake_case (database), handled primarily in supabaseDb.js.*