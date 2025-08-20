#!/usr/bin/env node

/**
 * Environment Variables Check Script
 * 
 * This script validates that all required environment variables are set
 * before building the application. It prevents deployment with missing
 * or invalid configuration.
 */

const required = [
  "REACT_APP_SUPABASE_URL", 
  "REACT_APP_SUPABASE_ANON_KEY"
];

const optional = [
  "REACT_APP_ENVIRONMENT",
  "REACT_APP_APP_NAME",
  "REACT_APP_VERSION"
];

console.log('🔍 Checking environment variables...\n');

// Check required variables
const missing = required.filter((key) => !process.env[key]);
const invalid = [];

// Validate URL format (cloud only)
if (process.env.REACT_APP_SUPABASE_URL) {
  try {
    new URL(process.env.REACT_APP_SUPABASE_URL);
    if (!process.env.REACT_APP_SUPABASE_URL.includes('supabase.co')) {
      invalid.push('REACT_APP_SUPABASE_URL (should be a Supabase Cloud URL: https://your-project-id.supabase.co)');
    }
  } catch (error) {
    invalid.push('REACT_APP_SUPABASE_URL (invalid URL format)');
  }
}

// Validate key format
if (process.env.REACT_APP_SUPABASE_ANON_KEY) {
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (key.length < 100 || !key.startsWith('eyJ')) {
    invalid.push('REACT_APP_SUPABASE_ANON_KEY (should be a JWT token starting with "eyJ")');
  }
  if (key.includes('your-') || key.includes('here')) {
    invalid.push('REACT_APP_SUPABASE_ANON_KEY (appears to be a placeholder value)');
  }
}

// Report results
if (missing.length === 0 && invalid.length === 0) {
  console.log('✅ All required environment variables are set and valid.');
  
  // Show optional variables status
  console.log('\n📋 Optional variables:');
  optional.forEach(key => {
    const value = process.env[key];
    if (value) {
      console.log(`   ✅ ${key}: ${value}`);
    } else {
      console.log(`   ⚪ ${key}: not set`);
    }
  });
  
  console.log('\n🚀 Ready to build!');
  process.exit(0);
} else {
  console.log('❌ Environment validation failed!\n');
  
  if (missing.length > 0) {
    console.log('📋 Missing required variables:');
    missing.forEach(key => {
      console.log(`   ❌ ${key}`);
    });
    console.log('');
  }
  
  if (invalid.length > 0) {
    console.log('⚠️  Invalid variables:');
    invalid.forEach(issue => {
      console.log(`   ❌ ${issue}`);
    });
    console.log('');
  }
  
  console.log('🔧 How to fix:');
  console.log('');
  console.log('1. Create a .env.local file in your project root:');
  console.log('   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co');
  console.log('   REACT_APP_SUPABASE_ANON_KEY=your-anon-public-key');
  console.log('');
  console.log('2. Get your credentials from:');
  console.log('   https://supabase.com/dashboard/project/your-project/settings/api');
  console.log('');
  console.log('3. For production deployment, set these variables in your hosting provider:');
  console.log('   - Vercel: Project Settings → Environment Variables');
  console.log('   - Netlify: Site Settings → Environment Variables');
  console.log('   - Other: Check your hosting provider\'s documentation');
  console.log('');
  
  process.exit(1);
}
