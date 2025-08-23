import { supabase } from '../lib/supabase';

/**
 * Comprehensive Supabase Configuration Checker
 * Checks project connectivity, authentication, and storage setup
 */

export const checkSupabaseConnection = async () => {
  console.log('🔍 Checking Supabase configuration...');
  
  const results = {
    timestamp: new Date().toISOString(),
    project: {
      url: process.env.REACT_APP_SUPABASE_URL,
      connected: false,
      error: null
    },
    auth: {
      available: false,
      currentUser: null,
      error: null
    },
    storage: {
      available: false,
      buckets: {},
      error: null
    },
    overall: 'unknown'
  };

  try {
    // 1. Test basic project connectivity
    console.log('📡 Testing project connectivity...');
    const { data, error } = await supabase.from('_test').select('*').limit(1);
    
    if (error && !error.message.includes('relation "_test" does not exist')) {
      results.project.connected = false;
      results.project.error = error.message;
      console.error('❌ Project connectivity failed:', error.message);
    } else {
      results.project.connected = true;
      console.log('✅ Project connectivity successful');
    }

    // 2. Check authentication
    console.log('🔐 Checking authentication status...');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        results.auth.error = authError.message;
        console.warn('⚠️ Auth error:', authError.message);
      } else if (user) {
        results.auth.available = true;
        results.auth.currentUser = {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        };
        console.log('✅ User authenticated:', user.email);
      } else {
        console.log('ℹ️ No user currently authenticated');
      }
    } catch (authError) {
      results.auth.error = authError.message;
      console.error('❌ Authentication check failed:', authError);
    }

    // 3. Check storage buckets
    console.log('🪣 Checking storage buckets...');
    const requiredBuckets = [
      'product-images',
      'product-documents', 
      'pos-images',
      'pos-documents'
    ];

    results.storage.available = true;
    
    for (const bucketName of requiredBuckets) {
      try {
        console.log(`  Checking bucket: ${bucketName}`);
        
        // Try to list files in the bucket
        const { data: listData, error: listError } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 });

        if (listError) {
          results.storage.buckets[bucketName] = {
            exists: false,
            accessible: false,
            error: listError.message,
            suggestion: listError.message.includes('not found') ? 'CREATE_BUCKET' : 'CHECK_PERMISSIONS'
          };
          console.error(`    ❌ ${bucketName}: ${listError.message}`);
        } else {
          results.storage.buckets[bucketName] = {
            exists: true,
            accessible: true,
            error: null,
            fileCount: listData ? listData.length : 0
          };
          console.log(`    ✅ ${bucketName}: Available (${listData ? listData.length : 0} items)`);
        }

      } catch (bucketError) {
        results.storage.buckets[bucketName] = {
          exists: false,
          accessible: false,
          error: bucketError.message,
          suggestion: 'CREATE_BUCKET'
        };
        console.error(`    💥 ${bucketName}: Exception - ${bucketError.message}`);
      }
    }

    // 4. Determine overall status
    const bucketsExist = Object.values(results.storage.buckets).filter(b => b.exists).length;
    const totalBuckets = requiredBuckets.length;
    
    if (results.project.connected && bucketsExist === totalBuckets) {
      results.overall = 'healthy';
    } else if (results.project.connected && bucketsExist > 0) {
      results.overall = 'partial';
    } else if (results.project.connected) {
      results.overall = 'buckets_missing';
    } else {
      results.overall = 'project_issues';
    }

    console.log('📊 Configuration check complete. Status:', results.overall);
    return results;

  } catch (error) {
    results.overall = 'failed';
    results.error = error.message;
    console.error('💥 Configuration check failed:', error);
    return results;
  }
};

/**
 * Generate setup instructions based on the configuration check results
 */
export const generateSetupInstructions = (checkResults) => {
  const instructions = [];
  
  if (!checkResults.project.connected) {
    instructions.push({
      priority: 'HIGH',
      category: 'Project Configuration',
      issue: 'Cannot connect to Supabase project',
      solution: [
        '1. Verify your REACT_APP_SUPABASE_URL in .env file',
        '2. Verify your REACT_APP_SUPABASE_ANON_KEY in .env file', 
        '3. Check if the Supabase project exists and is active',
        '4. Ensure the API keys are correct from Supabase Dashboard > Settings > API'
      ]
    });
  }

  const missingBuckets = Object.entries(checkResults.storage.buckets)
    .filter(([name, info]) => !info.exists)
    .map(([name]) => name);

  if (missingBuckets.length > 0) {
    instructions.push({
      priority: 'HIGH',
      category: 'Storage Buckets',
      issue: `Missing storage buckets: ${missingBuckets.join(', ')}`,
      solution: [
        '1. Go to Supabase Dashboard > Storage',
        '2. Create the following buckets:',
        ...missingBuckets.map(bucket => `   - ${bucket} (Public: true)`),
        '3. Or run the automated setup script we will create'
      ]
    });
  }

  const inaccessibleBuckets = Object.entries(checkResults.storage.buckets)
    .filter(([name, info]) => info.exists && !info.accessible)
    .map(([name]) => name);

  if (inaccessibleBuckets.length > 0) {
    instructions.push({
      priority: 'MEDIUM',
      category: 'Storage Permissions',
      issue: `Cannot access buckets: ${inaccessibleBuckets.join(', ')}`,
      solution: [
        '1. Go to Supabase Dashboard > Storage > Policies',
        '2. Create RLS policies for each bucket to allow authenticated users to:',
        '   - INSERT (upload files)',
        '   - SELECT (view/download files)',
        '   - DELETE (remove files, optional)',
        '3. Or run the automated policy setup script'
      ]
    });
  }

  if (!checkResults.auth.available) {
    instructions.push({
      priority: 'MEDIUM',
      category: 'Authentication',
      issue: 'No user currently authenticated',
      solution: [
        '1. Make sure you are logged into the application',
        '2. If login is not working, check your authentication setup',
        '3. Verify auth.users table exists in your Supabase project'
      ]
    });
  }

  return instructions;
};

/**
 * Print detailed diagnostic report
 */
export const printDiagnosticReport = async () => {
  console.log('\n🏥 === SUPABASE DIAGNOSTIC REPORT ===\n');
  
  const results = await checkSupabaseConnection();
  const instructions = generateSetupInstructions(results);
  
  console.log('📋 CONFIGURATION STATUS:');
  console.log(`   Overall: ${results.overall.toUpperCase()}`);
  console.log(`   Project Connected: ${results.project.connected ? '✅' : '❌'}`);
  console.log(`   User Authenticated: ${results.auth.available ? '✅' : '❌'}`);
  console.log(`   Storage Available: ${results.storage.available ? '✅' : '❌'}`);
  
  console.log('\n🪣 STORAGE BUCKETS:');
  Object.entries(results.storage.buckets).forEach(([name, info]) => {
    const status = info.exists ? (info.accessible ? '✅' : '⚠️ ') : '❌';
    console.log(`   ${status} ${name}: ${info.error || 'OK'}`);
  });
  
  if (instructions.length > 0) {
    console.log('\n🔧 SETUP INSTRUCTIONS:');
    instructions.forEach((instruction, index) => {
      console.log(`\n${index + 1}. [${instruction.priority}] ${instruction.category}`);
      console.log(`   Issue: ${instruction.issue}`);
      console.log('   Solutions:');
      instruction.solution.forEach(step => console.log(`     ${step}`));
    });
  } else {
    console.log('\n🎉 All systems are properly configured!');
  }
  
  console.log('\n=== END DIAGNOSTIC REPORT ===\n');
  
  return { results, instructions };
};

export default {
  checkSupabaseConnection,
  generateSetupInstructions,
  printDiagnosticReport
};
