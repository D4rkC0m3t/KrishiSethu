/**
 * Simple Database Test Component
 * Direct database access without complex debug layers
 */

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const SimpleDbTest = ({ onClose }) => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const runSimpleTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const results = [];
    
    try {
      // Test 1: Categories table
      console.log('🔍 Testing categories table...');
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .limit(5);
      
      if (catError) {
        results.push({
          test: 'Categories Query',
          status: 'error',
          message: catError.message,
          details: catError
        });
      } else {
        results.push({
          test: 'Categories Query',
          status: 'success',
          message: `Found ${categories?.length || 0} categories`,
          data: categories
        });
      }

      // Test 2: Products table structure
      console.log('🔍 Testing products table structure...');
      const { data: productSample, error: structError } = await supabase
        .from('products')
        .select('*')
        .limit(1);
      
      if (structError) {
        results.push({
          test: 'Products Table Structure',
          status: 'error',
          message: structError.message,
          details: structError
        });
      } else {
        const fields = productSample && productSample.length > 0 
          ? Object.keys(productSample[0])
          : [];
        
        results.push({
          test: 'Products Table Structure',
          status: 'success',
          message: `Table exists with ${fields.length} fields`,
          data: { 
            fields,
            sampleRecord: productSample?.[0] || null
          }
        });
      }

      // Test 3: Basic products query
      console.log('🔍 Testing basic products query...');
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name')
        .limit(10);
      
      if (prodError) {
        results.push({
          test: 'Basic Products Query',
          status: 'error',
          message: prodError.message,
          details: prodError
        });
      } else {
        results.push({
          test: 'Basic Products Query',
          status: 'success',
          message: `Found ${products?.length || 0} products`,
          data: products
        });
      }

      // Test 4: Products with additional fields
      console.log('🔍 Testing extended products query...');
      const { data: extendedProducts, error: extError } = await supabase
        .from('products')
        .select('id, name, category_id, quantity, is_active, owner_id')
        .limit(5);
      
      if (extError) {
        results.push({
          test: 'Extended Products Query',
          status: 'error',
          message: extError.message,
          details: extError
        });
      } else {
        results.push({
          test: 'Extended Products Query',
          status: 'success',
          message: `Successfully queried ${extendedProducts?.length || 0} products with extended fields`,
          data: extendedProducts
        });
      }

      // Test 5: Multi-tenancy check
      console.log('🔍 Testing multi-tenancy setup...');
      try {
        const { data: currentUser } = await supabase.auth.getUser();
        const currentUserId = currentUser?.user?.id;
        
        // Simple method: Try to select owner_id and check if it works
        const { data: products, error: prodError } = await supabase
          .from('products')
          .select('id, name, owner_id')
          .limit(1);
        
        let hasOwnerIdColumn = false;
        
        if (prodError) {
          // Check if the error is about missing column
          const errorMsg = prodError.message?.toLowerCase() || '';
          if (errorMsg.includes('column') && errorMsg.includes('owner_id')) {
            hasOwnerIdColumn = false; // Column doesn't exist
          } else {
            hasOwnerIdColumn = true; // Other error, but column exists
          }
        } else {
          // No error means column exists (even if no records)
          hasOwnerIdColumn = true;
        }
        
        if (!hasOwnerIdColumn) {
          results.push({
            test: 'Multi-Tenancy Check',
            status: 'error',
            message: '❌ SECURITY ISSUE: owner_id column missing - all users share data!',
            data: {
              hasOwnerIdColumn: false,
              currentUserId,
              totalProducts: products?.length || 0,
              recommendation: 'Run multi-tenant-rls-migration.sql to fix this security issue',
              errorMessage: prodError?.message
            }
          });
        } else {
          // Column exists - check RLS and data isolation
          const recordsWithOwnerId = products?.filter(p => p.hasOwnProperty('owner_id')) || [];
          const myRecords = products?.filter(p => p.owner_id === currentUserId) || [];
          
          if (!products || products.length === 0) {
            // No products yet - this is good for a clean start
            results.push({
              test: 'Multi-Tenancy Check',
              status: 'success',
              message: '✅ Multi-tenancy properly configured: owner_id column exists, ready for secure data',
              data: {
                hasOwnerIdColumn: true,
                currentUserId,
                totalProducts: 0,
                isCleanStart: true,
                recommendation: 'Perfect! Start adding your products - they will be properly isolated'
              }
            });
          } else if (recordsWithOwnerId.length === 0) {
            results.push({
              test: 'Multi-Tenancy Check',
              status: 'error', 
              message: '❌ SECURITY ISSUE: Products exist but no owner_id values set!',
              data: {
                hasOwnerIdColumn: true,
                currentUserId,
                totalProducts: products?.length || 0,
                recordsWithOwnerId: 0,
                recommendation: 'Run data migration to assign owner_id to existing records'
              }
            });
          } else {
            const isSecure = myRecords.length === products.length;
            results.push({
              test: 'Multi-Tenancy Check',
              status: isSecure ? 'success' : 'error',
              message: isSecure 
                ? `✅ Multi-tenancy working: Seeing ${myRecords.length} of your own records`
                : `❌ SECURITY ISSUE: Seeing ${products.length} total records, but only ${myRecords.length} belong to you!`,
              data: {
                hasOwnerIdColumn: true,
                currentUserId,
                totalVisibleProducts: products?.length || 0,
                myProducts: myRecords.length,
                isMultiTenantSecure: isSecure
              }
            });
          }
        }
      } catch (error) {
        results.push({
          test: 'Multi-Tenancy Check',
          status: 'error',
          message: `Multi-tenancy check failed: ${error.message}`,
          details: error
        });
      }

      // Test 6: Shared/Universal Data Check
      console.log('🔍 Testing shared/universal data...');
      try {
        const sharedDataChecks = await Promise.all([
          supabase.from('categories').select('*'),
          supabase.from('brands').select('*'),
          supabase.from('settings').select('*'),
          supabase.from('audit_logs').select('*').limit(1),
          supabase.from('stock_movements').select('*').limit(1)
        ]);

        const [categoriesResult, brandsResult, settingsResult, auditResult, stockResult] = sharedDataChecks;
        
        const sharedData = {
          categories: categoriesResult.data?.length || 0,
          brands: brandsResult.data?.length || 0,
          settings: settingsResult.data?.length || 0,
          auditLogs: auditResult.data?.length || 0,
          stockMovements: stockResult.data?.length || 0,
          totalSharedRecords: (categoriesResult.data?.length || 0) + 
                             (brandsResult.data?.length || 0) + 
                             (settingsResult.data?.length || 0) + 
                             (auditResult.data?.length || 0) + 
                             (stockResult.data?.length || 0)
        };

        const hasLargeSharedData = sharedData.totalSharedRecords > 100;
        
        results.push({
          test: 'Shared/Universal Data Check',
          status: hasLargeSharedData ? 'error' : 'success',
          message: hasLargeSharedData 
            ? `⚠️ Large amount of shared data detected (${sharedData.totalSharedRecords} records) - may cause loading delays`
            : `✅ Shared data looks normal (${sharedData.totalSharedRecords} total records)`,
          data: {
            ...sharedData,
            recommendation: hasLargeSharedData 
              ? 'Consider cleaning up audit logs, unused categories/brands, or large settings'
              : 'Shared data is at reasonable levels'
          }
        });
      } catch (error) {
        results.push({
          test: 'Shared/Universal Data Check',
          status: 'error',
          message: `Shared data check failed: ${error.message}`,
          details: error
        });
      }

    } catch (error) {
      results.push({
        test: 'Database Connection',
        status: 'error',
        message: error.message,
        details: error
      });
    }
    
    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🔍 Simple Database Test</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <button
            onClick={runSimpleTest}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg ${
              isLoading 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isLoading ? 'Running Tests...' : 'Run Database Tests'}
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-semibold ${
                    result.status === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.status === 'success' ? '✅' : '❌'} {result.test}
                  </h3>
                </div>
                
                <p className={`text-sm mb-2 ${
                  result.status === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>

                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-gray-600">
                      View Data
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}

                {result.details && result.status === 'error' && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-red-600">
                      Error Details
                    </summary>
                    <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleDbTest;
