// Database Seeding Script
// Run with: node seed-database.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCP7F9rGrvmquvDieiLZ1qahOo2dMXJ-WY",
  authDomain: "krishisetu-88b88.firebaseapp.com",
  projectId: "krishisetu-88b88",
  storageBucket: "krishisetu-88b88.firebasestorage.app",
  messagingSenderId: "1097162834618",
  appId: "1:1097162834618:web:0fbda0a418ef114109b883"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Seed Categories
    console.log('📁 Seeding categories...');
    const categories = [
      { name: 'Chemical Fertilizer', description: 'Chemical-based fertilizers', isActive: true },
      { name: 'Organic Fertilizer', description: 'Organic and natural fertilizers', isActive: true },
      { name: 'Bio Fertilizer', description: 'Biological fertilizers', isActive: true },
      { name: 'Micronutrients', description: 'Essential micronutrients', isActive: true }
    ];

    for (const category of categories) {
      await addDoc(collection(db, 'categories'), {
        ...category,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('✅ Categories seeded successfully!');

    // 2. Seed Brands
    console.log('🏷️ Seeding brands...');
    const brands = [
      { name: 'Tata Chemicals', description: 'Leading chemical company', isActive: true },
      { name: 'IFFCO', description: 'Indian Farmers Fertiliser Cooperative', isActive: true },
      { name: 'Coromandel', description: 'Coromandel International Limited', isActive: true },
      { name: 'UPL', description: 'United Phosphorus Limited', isActive: true }
    ];

    for (const brand of brands) {
      await addDoc(collection(db, 'brands'), {
        ...brand,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('✅ Brands seeded successfully!');

    // 3. Seed Products
    console.log('📦 Seeding products...');
    const products = [
      {
        name: 'NPK 20-20-20',
        category: 'Chemical Fertilizer',
        brand: 'Tata Chemicals',
        description: 'Balanced NPK fertilizer for all crops',
        hsn: '31051000',
        unit: 'BAG',
        quantity: 45,
        reorderPoint: 10,
        purchasePrice: 850,
        salePrice: 950,
        mrp: 1000,
        gstRate: 5,
        batchNo: 'TC2025001',
        expiryDate: new Date('2025-12-31'),
        isActive: true
      },
      {
        name: 'Urea',
        category: 'Chemical Fertilizer',
        brand: 'IFFCO',
        description: 'High quality urea fertilizer',
        hsn: '31021000',
        unit: 'BAG',
        quantity: 8,
        reorderPoint: 15,
        purchasePrice: 280,
        salePrice: 320,
        mrp: 350,
        gstRate: 5,
        batchNo: 'IF2025001',
        expiryDate: new Date('2026-06-30'),
        isActive: true
      },
      {
        name: 'DAP',
        category: 'Chemical Fertilizer',
        brand: 'Coromandel',
        description: 'Di-Ammonium Phosphate for root development',
        hsn: '31051000',
        unit: 'BAG',
        quantity: 25,
        reorderPoint: 10,
        purchasePrice: 1200,
        salePrice: 1350,
        mrp: 1400,
        gstRate: 5,
        batchNo: 'CR2025001',
        expiryDate: new Date('2025-03-15'),
        isActive: true
      }
    ];

    for (const product of products) {
      await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('✅ Products seeded successfully!');

    // 4. Seed Suppliers
    console.log('🏭 Seeding suppliers...');
    const suppliers = [
      {
        name: 'Tata Chemicals Ltd',
        contactPerson: 'Rajesh Kumar',
        email: 'rajesh@tatachemicals.com',
        phone: '+91-9876543210',
        address: {
          street: '123 Industrial Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        },
        gstNumber: '27AAAAA0000A1Z5',
        isActive: true
      },
      {
        name: 'IFFCO Cooperative',
        contactPerson: 'Suresh Patel',
        email: 'suresh@iffco.com',
        phone: '+91-9876543211',
        address: {
          street: '456 Cooperative Society',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          country: 'India'
        },
        gstNumber: '07BBBBB1111B2Z6',
        isActive: true
      }
    ];

    for (const supplier of suppliers) {
      await addDoc(collection(db, 'suppliers'), {
        ...supplier,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('✅ Suppliers seeded successfully!');

    // 5. Seed Customers
    console.log('👥 Seeding customers...');
    const customers = [
      {
        name: 'Ramesh Farmer',
        email: 'ramesh@example.com',
        phone: '+91-9876543212',
        address: {
          street: 'Village Khetpura',
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302001',
          country: 'India'
        },
        gstNumber: '',
        customerType: 'farmer',
        creditLimit: 50000,
        isActive: true
      },
      {
        name: 'Green Valley Agro',
        email: 'info@greenvalley.com',
        phone: '+91-9876543213',
        address: {
          street: '789 Market Road',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          country: 'India'
        },
        gstNumber: '27CCCCC2222C3Z7',
        customerType: 'dealer',
        creditLimit: 100000,
        isActive: true
      }
    ];

    for (const customer of customers) {
      await addDoc(collection(db, 'customers'), {
        ...customer,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('✅ Customers seeded successfully!');

    // 6. Seed Settings
    console.log('⚙️ Seeding settings...');
    await setDoc(doc(db, 'settings', 'system-settings'), {
      companyInfo: {
        name: 'Krishisethu Fertilizers',
        address: {
          street: '123 Agricultural Complex',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        },
        phone: '+91-9876543210',
        email: 'info@krishisethu.com',
        website: 'https://krishisethu.com',
        gstNumber: '27AAAAA0000A1Z5',
        panNumber: 'AAAAA0000A'
      },
      taxSettings: {
        defaultTaxRate: 5,
        gstEnabled: true,
        taxInclusive: false,
        hsnCode: '31051000'
      },
      inventorySettings: {
        lowStockThreshold: 10,
        autoReorderEnabled: false,
        barcodeEnabled: true,
        trackBatches: true,
        trackExpiry: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Settings seeded successfully!');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Categories: 4 items');
    console.log('✅ Brands: 4 items');
    console.log('✅ Products: 3 items');
    console.log('✅ Suppliers: 2 items');
    console.log('✅ Customers: 2 items');
    console.log('✅ Settings: 1 item');
    console.log('\n🚀 Your database is now ready to use!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }

  process.exit(0);
}

seedDatabase();
