import { useState, useEffect } from 'react'
import { 
  productsService, 
  categoriesService, 
  suppliersService,
  brandsService,
  stockMovementsService,
  databaseDiagnostics 
} from '../lib/supabaseDb'
import { supabaseAuthHelpers } from '../lib/supabase'

export const useInventory = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    nearExpiry: 0,
    totalValue: 0
  })

  useEffect(() => {
    initializeData()
  }, [])

  const initializeData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔧 Initializing inventory data...')
      
      // Get current user
      const currentUser = await supabaseAuthHelpers.getCurrentUser()
      if (!currentUser) {
        throw new Error('No authenticated user')
      }
      setUser(currentUser)

      // Run database health check first
      const healthCheck = await databaseDiagnostics.healthCheck()
      console.log('🏥 Database health:', healthCheck.overall)
      
      if (healthCheck.overall === 'critical') {
        throw new Error('Database connection failed')
      }

      // Load all data in parallel using the new service layer
      await Promise.all([
        loadProducts(),
        loadCategories(),
        loadSuppliers(),
        loadBrands()
      ])

      console.log('✅ Inventory data initialized successfully')

    } catch (err) {
      console.error('❌ Error initializing inventory data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      console.log('📦 Loading products...')
      const products = await productsService.getAll()
      console.log(`✅ Loaded ${products.length} products`)
      
      setProducts(products)
      calculateStats(products)
      
      return products
    } catch (err) {
      console.error('❌ Error loading products:', err)
      throw err
    }
  }

  const loadCategories = async () => {
    try {
      console.log('📂 Loading categories...')
      const categories = await categoriesService.getAll()
      console.log(`✅ Loaded ${categories.length} categories`)
      
      setCategories(categories)
      return categories
    } catch (err) {
      console.error('❌ Error loading categories:', err)
      throw err
    }
  }

  const loadSuppliers = async () => {
    try {
      console.log('🏢 Loading suppliers...')
      const suppliers = await suppliersService.getAll()
      console.log(`✅ Loaded ${suppliers.length} suppliers`)
      
      setSuppliers(suppliers)
      return suppliers
    } catch (err) {
      console.error('❌ Error loading suppliers:', err)
      throw err
    }
  }

  const loadBrands = async () => {
    try {
      console.log('🏷️ Loading brands...')
      const brands = await brandsService.getAll()
      console.log(`✅ Loaded ${brands.length} brands`)
      
      setBrands(brands)
      return brands
    } catch (err) {
      console.error('❌ Error loading brands:', err)
      throw err
    }
  }

  const calculateStats = (products) => {
    const stats = {
      totalProducts: products.length,
      lowStock: 0,
      outOfStock: 0,
      nearExpiry: 0,
      totalValue: 0
    }

    products.forEach(product => {
      const quantity = product.quantity || 0
      const salePrice = product.salePrice || product.sale_price || 0
      
      // Calculate stock status
      if (quantity === 0) {
        stats.outOfStock++
      } else if (quantity <= (product.minStockLevel || product.min_stock_level || 10)) {
        stats.lowStock++
      }

      // Calculate near expiry (within 30 days)
      if (product.expiryDate || product.expiry_date) {
        const expiryDate = new Date(product.expiryDate || product.expiry_date)
        const today = new Date()
        const diffTime = expiryDate - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays <= 30 && diffDays > 0) {
          stats.nearExpiry++
        }
      }

      // Calculate total value
      stats.totalValue += quantity * salePrice
    })

    setStats(stats)
    return stats
  }

  const addProduct = async (productData) => {
    try {
      if (!user) throw new Error('User not authenticated')

      console.log('➕ Adding new product:', productData.name)
      
      // Add created_by field
      const productWithUser = {
        ...productData,
        createdBy: user.id
      }

      const product = await productsService.create(productWithUser)
      console.log('✅ Product added successfully:', product.id)

      // Update local state
      setProducts(prev => [product, ...prev])
      
      // Recalculate stats
      const updatedProducts = [product, ...products]
      calculateStats(updatedProducts)
      
      return product
    } catch (err) {
      console.error('❌ Error adding product:', err)
      throw err
    }
  }

  const updateProduct = async (id, updates) => {
    try {
      console.log('✏️ Updating product:', id)
      
      const product = await productsService.update(id, updates)
      console.log('✅ Product updated successfully')

      // Update local state
      setProducts(prev => prev.map(p => p.id === id ? product : p))
      
      // Recalculate stats
      const updatedProducts = products.map(p => p.id === id ? product : p)
      calculateStats(updatedProducts)
      
      return product
    } catch (err) {
      console.error('❌ Error updating product:', err)
      throw err
    }
  }

  const deleteProduct = async (id) => {
    try {
      console.log('🗑️ Deleting product:', id)
      
      await productsService.delete(id)
      console.log('✅ Product deleted successfully')

      // Update local state
      setProducts(prev => prev.filter(p => p.id !== id))
      
      // Recalculate stats
      const updatedProducts = products.filter(p => p.id !== id)
      calculateStats(updatedProducts)
      
    } catch (err) {
      console.error('❌ Error deleting product:', err)
      throw err
    }
  }

  const addStockMovement = async (productId, movementType, quantity, notes = '') => {
    try {
      if (!user) throw new Error('User not authenticated')

      console.log('📦 Adding stock movement:', { productId, movementType, quantity })

      // Create stock movement record
      const movementData = {
        productId,
        movementType: movementType.toLowerCase(),
        quantity,
        notes,
        createdBy: user.id
      }

      const movement = await stockMovementsService.create(movementData)
      console.log('✅ Stock movement recorded:', movement.id)

      // Update product quantity
      const product = products.find(p => p.id === productId)
      if (product) {
        const currentQuantity = product.quantity || 0
        let newQuantity = currentQuantity

        switch (movementType.toLowerCase()) {
          case 'stock_in':
          case 'purchase':
          case 'adjustment_in':
            newQuantity = currentQuantity + quantity
            break
          case 'stock_out':
          case 'sale':
          case 'adjustment_out':
            newQuantity = Math.max(0, currentQuantity - quantity)
            break
          case 'adjustment':
            newQuantity = quantity // Direct adjustment to specific quantity
            break
          default:
            console.warn('Unknown movement type:', movementType)
        }

        // Update the product quantity
        await updateProduct(productId, { quantity: newQuantity })
      }

      return movement
    } catch (err) {
      console.error('❌ Error adding stock movement:', err)
      throw err
    }
  }

  const searchProducts = async (searchTerm) => {
    try {
      if (!searchTerm.trim()) {
        return products
      }

      console.log('🔍 Searching products:', searchTerm)
      const results = await productsService.search(searchTerm)
      console.log(`✅ Found ${results.length} products`)
      
      return results
    } catch (err) {
      console.error('❌ Error searching products:', err)
      throw err
    }
  }

  const getLowStockProducts = () => {
    return products.filter(product => {
      const quantity = product.quantity || 0
      const minStock = product.minStockLevel || product.min_stock_level || 10
      return quantity <= minStock && quantity > 0
    })
  }

  const getOutOfStockProducts = () => {
    return products.filter(product => (product.quantity || 0) === 0)
  }

  const getNearExpiryProducts = () => {
    return products.filter(product => {
      if (!product.expiryDate && !product.expiry_date) return false
      
      const expiryDate = new Date(product.expiryDate || product.expiry_date)
      const today = new Date()
      const diffTime = expiryDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays <= 30 && diffDays > 0
    })
  }

  const refreshData = async () => {
    console.log('🔄 Refreshing inventory data...')
    await initializeData()
  }

  return {
    // Data
    products,
    categories,
    suppliers,
    brands,
    stats,
    loading,
    error,
    user,
    
    // Actions
    addProduct,
    updateProduct,
    deleteProduct,
    addStockMovement,
    searchProducts,
    
    // Computed data
    getLowStockProducts,
    getOutOfStockProducts,
    getNearExpiryProducts,
    
    // Utilities
    refreshData,
    loadProducts,
    loadCategories,
    loadSuppliers,
    loadBrands
  }
}