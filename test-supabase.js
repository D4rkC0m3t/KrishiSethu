// Simple Supabase Connection Test
// Run this after setting up your environment variables

import { supabase, isSupabaseConfigured } from './src/lib/supabase.js';

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection...\n');

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    console.log('❌ Supabase is not configured properly');
    console.log('📝 Please check your .env file and ensure you have:');
    console.log('   REACT_APP_SUPABASE_URL=https://your-project.supabase.co');
    console.log('   REACT_APP_SUPABASE_ANON_KEY=your-anon-key');
    return;
  }

  try {
    // Test database connection
    console.log('1️⃣ Testing database connection...');
    const { data: categories, error: dbError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (dbError) {
      console.log('❌ Database test failed:', dbError.message);
      console.log('💡 Make sure you ran the schema SQL in Supabase dashboard');
      return;
    }

    console.log('✅ Database connection successful!');

    // Test authentication
    console.log('\n2️⃣ Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️ No authenticated user (this is normal for initial setup)');
    } else if (authData.user) {
      console.log('✅ User authenticated:', authData.user.email);
    } else {
      console.log('ℹ️ No user currently authenticated');
    }

    // Test if sample data exists
    console.log('\n3️⃣ Checking sample data...');
    if (categories && categories.length > 0) {
      console.log('✅ Sample categories found:', categories.length);
    } else {
      console.log('ℹ️ No sample data found (run schema SQL if needed)');
    }

    console.log('\n🎉 Supabase setup appears to be working correctly!');
    console.log('\nNext steps:');
    console.log('1. Go to your Supabase dashboard → Authentication → Settings');
    console.log('2. Configure your authentication providers');
    console.log('3. Start your React app with: npm start');

  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Check your internet connection');
    console.log('- Verify your Supabase project URL and API key');
    console.log('- Make sure your Supabase project is active');
  }
}

// Run the test
testSupabaseConnection();
