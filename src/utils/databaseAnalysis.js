import { supabase } from '../lib/supabase';

/**
 * Comprehensive Database Analysis Tool
 * Analyzes Supabase database structure, schema, and data
 */
export const analyzeDatabaseCompletely = async () => {
  console.log('🔍 Starting comprehensive database analysis...');
  const analysis = {
    timestamp: new Date().toISOString(),
    connection: null,
    tables: {},
    schemas: {},
    data: {},
    errors: [],
    recommendations: []
  };

  try {
    // Test basic connectivity
    console.log('📡 Testing database connectivity...');
    const { data: connectionTest, error: connError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    analysis.connection = {
      status: connError ? 'failed' : 'success',
      error: connError?.message || null,
      url: supabase.supabaseUrl,
      testResult: connectionTest ? 'data returned' : 'no data'
    };
    
    console.log('✅ Connection test:', analysis.connection.status);

    if (connError) {
      analysis.errors.push(`Connection failed: ${connError.message}`);
      return analysis;
    }

    // Analyze critical tables
    const criticalTables = ['profiles', 'users', 'customers', 'sales', 'products', 'categories'];
    
    for (const tableName of criticalTables) {
      console.log(`\n📋 Analyzing table: ${tableName}`);
      await analyzeTable(tableName, analysis);
    }

    // Generate recommendations
    generateRecommendations(analysis);

  } catch (error) {
    console.error('❌ Database analysis failed:', error);
    analysis.errors.push(`Analysis failed: ${error.message}`);
  }

  // Print comprehensive report
  printAnalysisReport(analysis);
  return analysis;
};

const analyzeTable = async (tableName, analysis) => {
  try {
    // Test table existence and get sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);

    if (sampleError) {
      analysis.tables[tableName] = {
        exists: false,
        error: sampleError.message,
        accessible: false
      };
      console.log(`❌ Table ${tableName}: ${sampleError.message}`);
      return;
    }

    // Get row count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    // Analyze schema
    const schema = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
    
    analysis.tables[tableName] = {
      exists: true,
      accessible: true,
      rowCount: count || 0,
      schema: schema,
      sampleData: sampleData || [],
      hasData: (sampleData && sampleData.length > 0)
    };

    // Store detailed schema analysis
    analysis.schemas[tableName] = analyzeSchema(schema, sampleData);
    
    // Store actual data samples
    analysis.data[tableName] = sampleData;

    console.log(`✅ Table ${tableName}: ${count || 0} rows, ${schema.length} columns`);
    console.log(`📊 Columns: ${schema.join(', ')}`);
    
    if (sampleData && sampleData.length > 0) {
      console.log(`🔍 Sample data:`, sampleData[0]);
    }

  } catch (error) {
    analysis.tables[tableName] = {
      exists: false,
      error: error.message,
      accessible: false
    };
    console.log(`❌ Table ${tableName} analysis failed:`, error.message);
  }
};

const analyzeSchema = (columns, sampleData) => {
  const schemaAnalysis = {
    totalColumns: columns.length,
    columnTypes: {},
    nameColumns: [],
    roleColumns: [],
    activeColumns: [],
    paidColumns: [],
    trialColumns: [],
    companyColumns: [],
    dateColumns: []
  };

  // Categorize columns by likely purpose
  columns.forEach(col => {
    const lowerCol = col.toLowerCase();
    
    // Name variations
    if (['name', 'full_name', 'user_name', 'display_name', 'first_name', 'last_name'].includes(lowerCol)) {
      schemaAnalysis.nameColumns.push(col);
    }
    
    // Role variations
    if (['role', 'user_role', 'account_type', 'user_type', 'permission'].includes(lowerCol)) {
      schemaAnalysis.roleColumns.push(col);
    }
    
    // Active status variations
    if (['is_active', 'active', 'status', 'enabled', 'disabled'].includes(lowerCol)) {
      schemaAnalysis.activeColumns.push(col);
    }
    
    // Paid status variations
    if (['is_paid', 'paid', 'is_premium', 'premium', 'subscription'].includes(lowerCol)) {
      schemaAnalysis.paidColumns.push(col);
    }
    
    // Trial variations
    if (['trial_end_date', 'trial_end', 'trial_expires_at', 'trial_expiry', 'trial'].includes(lowerCol)) {
      schemaAnalysis.trialColumns.push(col);
    }
    
    // Company variations
    if (['company_name', 'company', 'organization', 'business_name', 'org'].includes(lowerCol)) {
      schemaAnalysis.companyColumns.push(col);
    }
    
    // Date columns
    if (lowerCol.includes('date') || lowerCol.includes('time') || ['created_at', 'updated_at'].includes(lowerCol)) {
      schemaAnalysis.dateColumns.push(col);
    }
  });

  // Analyze data types from sample data
  if (sampleData && sampleData.length > 0) {
    const sample = sampleData[0];
    columns.forEach(col => {
      const value = sample[col];
      if (value !== null && value !== undefined) {
        schemaAnalysis.columnTypes[col] = typeof value;
      }
    });
  }

  return schemaAnalysis;
};

const generateRecommendations = (analysis) => {
  const recommendations = [];

  // Check if profiles table exists and has data
  if (analysis.tables.profiles) {
    if (!analysis.tables.profiles.exists) {
      recommendations.push('❌ CRITICAL: profiles table does not exist or is not accessible');
    } else if (analysis.tables.profiles.rowCount === 0) {
      recommendations.push('⚠️ WARNING: profiles table is empty - no users found');
    } else {
      recommendations.push(`✅ profiles table found with ${analysis.tables.profiles.rowCount} records`);
    }

    // Check for required columns
    if (analysis.schemas.profiles) {
      const schema = analysis.schemas.profiles;
      
      if (schema.nameColumns.length === 0) {
        recommendations.push('⚠️ No name columns found in profiles table');
      } else {
        recommendations.push(`✅ Name columns available: ${schema.nameColumns.join(', ')}`);
      }
      
      if (schema.roleColumns.length === 0) {
        recommendations.push('⚠️ No role columns found in profiles table');
      } else {
        recommendations.push(`✅ Role columns available: ${schema.roleColumns.join(', ')}`);
      }
      
      if (schema.trialColumns.length === 0) {
        recommendations.push('⚠️ No trial date columns found in profiles table');
      } else {
        recommendations.push(`✅ Trial columns available: ${schema.trialColumns.join(', ')}`);
      }
    }
  }

  // Check other critical tables
  ['customers', 'sales', 'products'].forEach(table => {
    if (analysis.tables[table] && analysis.tables[table].exists) {
      recommendations.push(`✅ ${table} table found with ${analysis.tables[table].rowCount} records`);
    } else {
      recommendations.push(`⚠️ ${table} table missing or inaccessible`);
    }
  });

  analysis.recommendations = recommendations;
};

const printAnalysisReport = (analysis) => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE DATABASE ANALYSIS REPORT');
  console.log('='.repeat(60));
  
  console.log('\n🔗 CONNECTION STATUS:');
  console.log(`Status: ${analysis.connection?.status || 'unknown'}`);
  console.log(`URL: ${analysis.connection?.url || 'unknown'}`);
  if (analysis.connection?.error) {
    console.log(`Error: ${analysis.connection.error}`);
  }

  console.log('\n📋 TABLE SUMMARY:');
  Object.entries(analysis.tables).forEach(([table, info]) => {
    const status = info.exists ? '✅' : '❌';
    const count = info.rowCount || 0;
    const cols = info.schema?.length || 0;
    console.log(`${status} ${table}: ${count} rows, ${cols} columns`);
  });

  console.log('\n🔍 SCHEMA DETAILS:');
  Object.entries(analysis.schemas).forEach(([table, schema]) => {
    if (schema) {
      console.log(`\n📋 ${table.toUpperCase()}:`);
      console.log(`  📝 Name fields: ${schema.nameColumns.join(', ') || 'none'}`);
      console.log(`  👤 Role fields: ${schema.roleColumns.join(', ') || 'none'}`);
      console.log(`  ✅ Active fields: ${schema.activeColumns.join(', ') || 'none'}`);
      console.log(`  💰 Paid fields: ${schema.paidColumns.join(', ') || 'none'}`);
      console.log(`  📅 Trial fields: ${schema.trialColumns.join(', ') || 'none'}`);
      console.log(`  🏢 Company fields: ${schema.companyColumns.join(', ') || 'none'}`);
    }
  });

  console.log('\n📋 SAMPLE DATA:');
  Object.entries(analysis.data).forEach(([table, data]) => {
    if (data && data.length > 0) {
      console.log(`\n🔍 ${table.toUpperCase()} sample:`, data[0]);
    }
  });

  console.log('\n💡 RECOMMENDATIONS:');
  analysis.recommendations.forEach(rec => console.log(`  ${rec}`));

  if (analysis.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    analysis.errors.forEach(err => console.log(`  ${err}`));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 ANALYSIS COMPLETE');
  console.log('='.repeat(60));
};

// Quick analysis function for specific issues
export const quickProfilesAnalysis = async () => {
  console.log('🔍 Quick profiles table analysis...');
  
  try {
    // Test different common table names
    const tableNames = ['profiles', 'users', 'user_profiles', 'accounts'];
    
    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        
        if (!error && data) {
          console.log(`✅ Found table: ${tableName}`);
          console.log(`📋 Columns: ${Object.keys(data[0] || {}).join(', ')}`);
          console.log(`🔍 Sample: `, data[0]);
          return { tableName, schema: Object.keys(data[0] || {}), sample: data[0] };
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
    console.log('❌ No accessible user tables found');
    return null;
    
  } catch (error) {
    console.error('❌ Quick analysis failed:', error);
    return null;
  }
};