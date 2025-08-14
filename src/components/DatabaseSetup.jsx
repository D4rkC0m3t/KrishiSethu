import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { supabaseAuthHelpers } from '../lib/supabase';
import { usersService } from '../lib/supabaseDb';
import { CheckCircle, AlertCircle, Loader2, User, Database, Settings } from 'lucide-react';

const DatabaseSetup = () => {
  const [setupStep, setSetupStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adminCredentials, setAdminCredentials] = useState({
    email: 'admin@krishisethu.com',
    password: 'admin123'
  });

  const createAdminUser = async () => {
    try {
      setLoading(true);
      setError('');
      
      let adminUser;
      
      try {
        // Try to create new admin user
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          adminCredentials.email, 
          adminCredentials.password
        );
        adminUser = userCredential.user;
        setSuccess('✅ Admin user created successfully!');
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          // User exists, try to sign in
          const userCredential = await signInWithEmailAndPassword(
            auth,
            adminCredentials.email,
            adminCredentials.password
          );
          adminUser = userCredential.user;
          setSuccess('✅ Admin user already exists, signed in!');
        } else {
          throw error;
        }
      }

      // Create admin profile in Firestore
      await setDoc(doc(db, 'users', adminUser.uid), {
        uid: adminUser.uid,
        email: adminUser.email,
        name: 'System Administrator',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        permissions: {
          canManageUsers: true,
          canManageProducts: true,
          canManageSuppliers: true,
          canManageCustomers: true,
          canViewReports: true,
          canManageSettings: true,
          canManageBackups: true
        }
      });

      setSetupStep(2);
      
    } catch (error) {
      setError(`❌ Error creating admin user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const seedDatabase = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Seed Categories
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

      // Seed Brands
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

      // Seed Products
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

      // Seed Suppliers
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

      // Seed Customers
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

      setSetupStep(3);
      setSuccess('✅ Database seeded successfully!');
      
    } catch (error) {
      setError(`❌ Error seeding database: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createSystemSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
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

      setSetupStep(4);
      setSuccess('✅ System settings created successfully!');
      
    } catch (error) {
      setError(`❌ Error creating settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Database Setup Wizard
          </CardTitle>
          <CardDescription>
            Initialize your inventory management system with sample data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Create Admin User */}
          <div className={`p-4 border rounded-lg ${setupStep >= 1 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5" />
              <h3 className="font-medium">Step 1: Create Admin User</h3>
              {setupStep > 1 && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            
            {setupStep === 1 && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={adminCredentials.email}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <Button onClick={createAdminUser} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Admin User
                </Button>
              </div>
            )}
          </div>

          {/* Step 2: Seed Database */}
          <div className={`p-4 border rounded-lg ${setupStep >= 2 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-5 w-5" />
              <h3 className="font-medium">Step 2: Seed Database</h3>
              {setupStep > 2 && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            
            {setupStep === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  This will create sample products, categories, brands, suppliers, and customers.
                </p>
                <Button onClick={seedDatabase} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Seed Database
                </Button>
              </div>
            )}
          </div>

          {/* Step 3: Create Settings */}
          <div className={`p-4 border rounded-lg ${setupStep >= 3 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-5 w-5" />
              <h3 className="font-medium">Step 3: System Settings</h3>
              {setupStep > 3 && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            
            {setupStep === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Configure system settings including company information and tax settings.
                </p>
                <Button onClick={createSystemSettings} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Settings
                </Button>
              </div>
            )}
          </div>

          {/* Step 4: Complete */}
          {setupStep === 4 && (
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="font-medium text-green-800">Setup Complete!</h3>
              </div>
              <p className="text-sm text-green-700 mb-3">
                Your database has been successfully initialized with sample data.
              </p>
              <div className="text-sm text-green-700">
                <p><strong>Admin Login:</strong></p>
                <p>Email: {adminCredentials.email}</p>
                <p>Password: {adminCredentials.password}</p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseSetup;
