#!/usr/bin/env node

/**
 * Add Sample Data Script
 * Adds sample data to your empty but accessible tables
 */

const { createClient } = require('@supabase/supabase-js');

// Using the exact same configuration as your React app
const supabaseUrl = 'https://lnljcgttcdhrduixirgf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function addSampleData() {
  console.log('📦 Adding sample data to empty tables...');
  console.log('');
  
  // Add sample categories
  console.log('🏷️ Adding categories...');
  const categories = [
    { name: 'Compound Fertilizers', description: 'Multi-nutrient fertilizers with NPK combinations' },
    { name: 'Nitrogen Fertilizers', description: 'High nitrogen content fertilizers' },
    { name: 'Phosphorus Fertilizers', description: 'Phosphorus-rich fertilizers for root development' },
    { name: 'Potassium Fertilizers', description: 'Potassium fertilizers for plant strength' },
    { name: 'Organic Fertilizers', description: 'Natural and organic fertilizer options' }
  ];
  
  const { data: catData, error: catError } = await supabase
    .from('categories')
    .insert(categories)
    .select();
    
  if (catError) {
    console.log('❌ Categories failed:', catError.message);
  } else {
    console.log(`✅ Added ${catData.length} categories`);
  }
  
  // Add sample brands
  console.log('🏪 Adding brands...');
  const brands = [
    { name: 'AgriCorp', description: 'Premium agricultural products and fertilizers' },
    { name: 'FertMax', description: 'Maximum yield fertilizer solutions' },
    { name: 'CropGrow', description: 'Complete crop nutrition systems' },
    { name: 'NutriCrop', description: 'Essential plant nutrition products' },
    { name: 'EcoFarm', description: 'Sustainable and organic farming solutions' },
    { name: 'GreenGold', description: 'Gold standard in agricultural inputs' }
  ];
  
  const { data: brandData, error: brandError } = await supabase
    .from('brands')
    .insert(brands)
    .select();
    
  if (brandError) {
    console.log('❌ Brands failed:', brandError.message);
  } else {
    console.log(`✅ Added ${brandData.length} brands`);
  }
  
  // Add sample suppliers
  console.log('🚛 Adding suppliers...');
  const suppliers = [
    { 
      name: 'AgriCorp Industries', 
      email: 'sales@agricorp.com',
      phone: '+91-9876543210',
      address: 'Industrial Area, Sector 5, Pune, Maharashtra',
      contact_person: 'Raj Kumar' 
    },
    { 
      name: 'FertMax Ltd', 
      email: 'orders@fertmax.com',
      phone: '+91-9876543211',
      address: 'Plot No. 12, MIDC, Nashik, Maharashtra',
      contact_person: 'Priya Sharma' 
    },
    { 
      name: 'CropGrow Solutions', 
      email: 'info@cropgrow.com',
      phone: '+91-9876543212',
      address: 'Fertilizer Complex, Kota, Rajasthan',
      contact_person: 'Amit Singh' 
    }
  ];
  
  const { data: supplierData, error: supplierError } = await supabase
    .from('suppliers')
    .insert(suppliers)
    .select();
    
  if (supplierError) {
    console.log('❌ Suppliers failed:', supplierError.message);
  } else {
    console.log(`✅ Added ${supplierData.length} suppliers`);
  }
  
  // Add sample products
  console.log('🌾 Adding products...');
  const products = [
    {
      name: 'NPK 20-20-20',
      description: 'Balanced NPK fertilizer suitable for all crops',
      category: 'Compound Fertilizers',
      brand: 'AgriCorp',
      sku: 'NPK-202020-001',
      unit_price: 450.00,
      sale_price: 500.00,
      quantity: 100,
      unit: 'kg',
      reorder_level: 20,
      supplier: 'AgriCorp Industries',
      status: 'active'
    },
    {
      name: 'Urea 46%',
      description: 'High nitrogen content urea fertilizer',
      category: 'Nitrogen Fertilizers',
      brand: 'FertMax',
      sku: 'UREA-46-001',
      unit_price: 350.00,
      sale_price: 400.00,
      quantity: 150,
      unit: 'kg',
      reorder_level: 25,
      supplier: 'FertMax Ltd',
      status: 'active'
    },
    {
      name: 'DAP 18-46-0',
      description: 'Di-ammonium phosphate fertilizer',
      category: 'Phosphorus Fertilizers',
      brand: 'CropGrow',
      sku: 'DAP-18460-001',
      unit_price: 520.00,
      sale_price: 580.00,
      quantity: 80,
      unit: 'kg',
      reorder_level: 15,
      supplier: 'CropGrow Solutions',
      status: 'active'
    },
    {
      name: 'Potash MOP',
      description: 'Muriate of Potash for potassium nutrition',
      category: 'Potassium Fertilizers',
      brand: 'NutriCrop',
      sku: 'MOP-001',
      unit_price: 380.00,
      sale_price: 420.00,
      quantity: 60,
      unit: 'kg',
      reorder_level: 20,
      supplier: 'AgriCorp Industries',
      status: 'active'
    },
    {
      name: 'Organic Compost Premium',
      description: 'Premium quality organic compost',
      category: 'Organic Fertilizers',
      brand: 'EcoFarm',
      sku: 'COMP-ORG-001',
      unit_price: 150.00,
      sale_price: 180.00,
      quantity: 200,
      unit: 'kg',
      reorder_level: 30,
      supplier: 'FertMax Ltd',
      status: 'active'
    },
    {
      name: 'Triple Super Phosphate',
      description: 'High phosphorus fertilizer TSP',
      category: 'Phosphorus Fertilizers',
      brand: 'GreenGold',
      sku: 'TSP-001',
      unit_price: 600.00,
      sale_price: 680.00,
      quantity: 50,
      unit: 'kg',
      reorder_level: 10,
      supplier: 'CropGrow Solutions',
      status: 'active'
    },
    {
      name: 'NPK 12-32-16',
      description: 'High phosphorus NPK for flowering stage',
      category: 'Compound Fertilizers',
      brand: 'AgriCorp',
      sku: 'NPK-123216-001',
      unit_price: 480.00,
      sale_price: 530.00,
      quantity: 75,
      unit: 'kg',
      reorder_level: 18,
      supplier: 'AgriCorp Industries',
      status: 'active'
    },
    {
      name: 'Calcium Nitrate',
      description: 'Water soluble calcium and nitrogen fertilizer',
      category: 'Nitrogen Fertilizers',
      brand: 'CropGrow',
      sku: 'CANO3-001',
      unit_price: 720.00,
      sale_price: 800.00,
      quantity: 40,
      unit: 'kg',
      reorder_level: 12,
      supplier: 'CropGrow Solutions',
      status: 'active'
    }
  ];
  
  const { data: productData, error: productError } = await supabase
    .from('products')
    .insert(products)
    .select();
    
  if (productError) {
    console.log('❌ Products failed:', productError.message);
  } else {
    console.log(`✅ Added ${productData.length} products`);
  }
  
  console.log('');
  console.log('🎉 Sample data added successfully!');
  console.log('💡 Your inventory should now show real data when you refresh.');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Categories: ${catData?.length || 0}`);
  console.log(`   Brands: ${brandData?.length || 0}`);
  console.log(`   Suppliers: ${supplierData?.length || 0}`);
  console.log(`   Products: ${productData?.length || 0}`);
}

addSampleData().catch((err) => {
  console.error('💥 Sample data script failed:', err.message);
  process.exit(1);
});
