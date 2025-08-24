const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function investigatePhantomData() {
  console.log('🔍 INVESTIGATING PHANTOM DATA SOURCE');
  console.log('===================================');
  console.log('UI shows data but our tests show 0 records!');
  console.log('');
  
  // Check all possible data sources
  const tables = ['suppliers', 'purchases', 'customers', 'products', 'sales'];
  
  for (const table of tables) {
    console.log(`\n🧪 Deep check: ${table}`);
    console.log('========================');
    
    try {
      // Try different approaches to get data
      const approaches = [
        { name: 'Standard query', query: supabase.from(table).select('*') },
        { name: 'With count', query: supabase.from(table).select('*', { count: 'exact' }) },
        { name: 'Specific columns', query: supabase.from(table).select('id, name, created_at, organization_id') },
        { name: 'Order by created_at desc', query: supabase.from(table).select('*').order('created_at', { ascending: false }) },
        { name: 'No RLS (if possible)', query: supabase.from(table).select('*').limit(10) }
      ];
      
      for (const approach of approaches) {
        const { data, error, count } = await approach.query;
        
        if (error) {
          console.log(`  ❌ ${approach.name}: ${error.message}`);
        } else {
          console.log(`  ✅ ${approach.name}: ${data?.length || 0} records${count !== undefined ? ` (total: ${count})` : ''}`);
          
          if (data && data.length > 0) {
            console.log(`    🔍 First record preview:`);
            const first = data[0];
            Object.keys(first).forEach(key => {
              const value = first[key];
              if (value && typeof value === 'string' && value.length > 50) {
                console.log(`      ${key}: ${value.substring(0, 50)}...`);
              } else {
                console.log(`      ${key}: ${value}`);
              }
            });
            
            // Check organization distribution
            const orgIds = [...new Set(data.map(row => row.organization_id).filter(id => id))];
            console.log(`    📊 Organization distribution:`);
            console.log(`      - Records with org_id: ${data.filter(row => row.organization_id).length}`);
            console.log(`      - Records without org_id: ${data.filter(row => !row.organization_id).length}`);
            console.log(`      - Different organizations: ${orgIds.length}`);
            if (orgIds.length > 0) {
              console.log(`      - Org IDs: ${orgIds.map(id => id.substring(0, 8)).join(', ')}`);
            }
          }
        }
      }
    } catch (err) {
      console.log(`  ❌ Error checking ${table}: ${err.message}`);
    }
  }
  
  console.log('\n🎯 POTENTIAL ROOT CAUSES:');
  console.log('==========================');
  console.log('1. Data exists but RLS is hiding it in our tests');
  console.log('2. UI is reading from different tables/views');
  console.log('3. Frontend caching old data');
  console.log('4. Different database connection/environment');
  console.log('5. Data exists under different organization_id');
  console.log('6. UI using mock/sample data instead of real DB');
  
  console.log('\n🔍 CHECKING AUTHENTICATION STATE:');
  console.log('==================================');
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user?.email || 'Anonymous');
  console.log('User ID:', user?.id || 'No user ID');
  console.log('Organization ID:', user?.organization_id || 'Not available');
}

investigatePhantomData().catch(console.error);
