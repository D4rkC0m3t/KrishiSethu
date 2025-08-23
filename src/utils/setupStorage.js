import { supabase } from '../lib/supabase';

/**
 * Automated Supabase Storage Setup
 * Creates missing storage buckets and configures proper policies
 */

const REQUIRED_BUCKETS = [
  {
    name: 'product-images',
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    fileSizeLimit: 10485760 // 10MB
  },
  {
    name: 'product-documents', 
    public: true,
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    fileSizeLimit: 20971520 // 20MB
  },
  {
    name: 'pos-images',
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    fileSizeLimit: 5242880 // 5MB
  },
  {
    name: 'pos-documents',
    public: true,
    allowedMimeTypes: [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    fileSizeLimit: 10485760 // 10MB
  }
];

/**
 * Create a storage bucket if it doesn't exist
 */
export const createBucket = async (bucketConfig) => {
  const { name, public: isPublic, allowedMimeTypes, fileSizeLimit } = bucketConfig;
  
  try {
    console.log(`🪣 Creating bucket: ${name}...`);
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket(name, {
      public: isPublic,
      allowedMimeTypes,
      fileSizeLimit
    });
    
    if (error) {
      // Check if bucket already exists
      if (error.message && error.message.includes('already exists')) {
        console.log(`ℹ️ Bucket ${name} already exists`);
        return { success: true, existed: true };
      } else {
        console.error(`❌ Failed to create bucket ${name}:`, error.message);
        return { success: false, error: error.message };
      }
    }
    
    console.log(`✅ Successfully created bucket: ${name}`);
    return { success: true, existed: false, data };
    
  } catch (error) {
    console.error(`💥 Exception creating bucket ${name}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Create RLS policy for a storage bucket
 */
export const createBucketPolicy = async (bucketName, policyName, operation, definition) => {
  try {
    console.log(`🔐 Creating ${operation} policy for bucket: ${bucketName}...`);
    
    // Note: Supabase storage policies are typically created via SQL
    // Since we can't execute SQL directly from the client, we'll create a policy template
    const policySQL = `
      CREATE POLICY "${policyName}" ON storage.objects
      FOR ${operation.toUpperCase()} 
      USING (bucket_id = '${bucketName}' AND ${definition});
    `;
    
    console.log(`📝 Policy SQL for ${bucketName} (${operation}):`);
    console.log(policySQL);
    
    return {
      success: true,
      sql: policySQL,
      message: `Policy template created for ${bucketName} - ${operation}`
    };
    
  } catch (error) {
    console.error(`❌ Error creating policy for ${bucketName}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Generate standard storage policies for authenticated users
 */
export const generateStoragePolicies = (bucketName) => {
  const policies = [
    {
      name: `${bucketName}_select_policy`,
      operation: 'select',
      definition: 'auth.role() = \'authenticated\''
    },
    {
      name: `${bucketName}_insert_policy`, 
      operation: 'insert',
      definition: 'auth.role() = \'authenticated\''
    },
    {
      name: `${bucketName}_update_policy`,
      operation: 'update', 
      definition: 'auth.role() = \'authenticated\' AND auth.uid()::text = (storage.foldername(name))[1]'
    },
    {
      name: `${bucketName}_delete_policy`,
      operation: 'delete',
      definition: 'auth.role() = \'authenticated\' AND auth.uid()::text = (storage.foldername(name))[1]'
    }
  ];
  
  return policies;
};

/**
 * Setup all required storage buckets
 */
export const setupAllBuckets = async () => {
  console.log('🚀 Starting automated storage setup...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    buckets: {},
    policies: {},
    success: true,
    errors: []
  };
  
  try {
    // Create all required buckets
    for (const bucketConfig of REQUIRED_BUCKETS) {
      const bucketResult = await createBucket(bucketConfig);
      results.buckets[bucketConfig.name] = bucketResult;
      
      if (!bucketResult.success) {
        results.success = false;
        results.errors.push(`Failed to create bucket ${bucketConfig.name}: ${bucketResult.error}`);
      }
    }
    
    // Generate policy templates for each bucket
    console.log('\n📋 Generating storage policy templates...');
    for (const bucketConfig of REQUIRED_BUCKETS) {
      const bucketName = bucketConfig.name;
      const policies = generateStoragePolicies(bucketName);
      
      results.policies[bucketName] = [];
      
      for (const policy of policies) {
        const policyResult = await createBucketPolicy(
          bucketName,
          policy.name,
          policy.operation,
          policy.definition
        );
        
        results.policies[bucketName].push(policyResult);
      }
    }
    
    console.log('\n📊 Setup Results:');
    console.log('==================');
    
    // Print bucket results
    Object.entries(results.buckets).forEach(([name, result]) => {
      const status = result.success ? (result.existed ? '⚠️  EXISTS' : '✅ CREATED') : '❌ FAILED';
      console.log(`${status} ${name}`);
      if (!result.success) {
        console.log(`         Error: ${result.error}`);
      }
    });
    
    // Print policy information
    console.log('\n🔐 Storage Policies:');
    console.log('Note: These need to be manually applied in the Supabase Dashboard or via SQL.');
    console.log('Go to: Dashboard > SQL Editor and run the generated SQL statements.\n');
    
    const allPolicySQL = [];
    Object.entries(results.policies).forEach(([bucketName, policies]) => {
      policies.forEach(policy => {
        if (policy.success && policy.sql) {
          allPolicySQL.push(policy.sql);
        }
      });
    });
    
    if (allPolicySQL.length > 0) {
      console.log('📝 Combined Policy SQL:');
      console.log('========================');
      console.log(allPolicySQL.join('\n\n'));
    }
    
    console.log('\n🎉 Storage setup completed!');
    console.log(`Created/checked ${Object.keys(results.buckets).length} buckets`);
    console.log(`Generated ${allPolicySQL.length} policy templates`);
    
    return results;
    
  } catch (error) {
    results.success = false;
    results.errors.push(`Setup failed: ${error.message}`);
    console.error('💥 Storage setup failed:', error);
    return results;
  }
};

/**
 * Verify bucket exists and is accessible
 */
export const verifyBucket = async (bucketName) => {
  try {
    console.log(`🔍 Verifying bucket: ${bucketName}...`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });
    
    if (error) {
      console.error(`❌ Bucket ${bucketName} verification failed:`, error.message);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ Bucket ${bucketName} is accessible`);
    return { success: true, accessible: true };
    
  } catch (error) {
    console.error(`💥 Exception verifying bucket ${bucketName}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Verify all buckets are working
 */
export const verifyAllBuckets = async () => {
  console.log('🔍 Verifying all storage buckets...\n');
  
  const results = {};
  let allSuccessful = true;
  
  for (const bucketConfig of REQUIRED_BUCKETS) {
    const result = await verifyBucket(bucketConfig.name);
    results[bucketConfig.name] = result;
    
    if (!result.success) {
      allSuccessful = false;
    }
  }
  
  console.log('\n📊 Verification Results:');
  Object.entries(results).forEach(([name, result]) => {
    const status = result.success ? '✅ ACCESSIBLE' : '❌ FAILED';
    console.log(`${status} ${name}`);
    if (!result.success) {
      console.log(`         Error: ${result.error}`);
    }
  });
  
  if (allSuccessful) {
    console.log('\n🎉 All buckets are accessible!');
  } else {
    console.log('\n⚠️ Some buckets are not accessible. Run setupAllBuckets() to fix.');
  }
  
  return { allSuccessful, results };
};

/**
 * Quick diagnostic and setup function
 */
export const diagnoseAndSetup = async () => {
  console.log('🏥 Running storage diagnosis and setup...\n');
  
  // First, verify current state
  const verification = await verifyAllBuckets();
  
  if (!verification.allSuccessful) {
    console.log('\n🔧 Issues detected. Running automated setup...\n');
    const setupResults = await setupAllBuckets();
    
    if (setupResults.success) {
      console.log('\n🔍 Re-verifying after setup...\n');
      await verifyAllBuckets();
    }
    
    return setupResults;
  } else {
    console.log('\n✅ No setup required - all buckets are working!');
    return { success: true, message: 'All buckets are already properly configured' };
  }
};

export default {
  setupAllBuckets,
  createBucket,
  verifyBucket,
  verifyAllBuckets,
  diagnoseAndSetup,
  REQUIRED_BUCKETS
};
