const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function auditDatabase() {
  console.log('🔍 Auditing database tables for admin functions...\n');

  // Check what tables exist
  const tables = [
    'profiles',
    'brands', 
    'cvs',
    'subscriptions',
    'payments',
    'content_moderation',
    'system_config',
    'audit_logs',
    'notifications'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0} records`);
      }
    } catch (err) {
      console.log(`❌ ${table}: Table doesn't exist or access denied`);
    }
  }

  // Check profiles table structure
  console.log('\n📊 Checking profiles table structure...');
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (profiles && profiles.length > 0) {
      console.log('Profiles columns:', Object.keys(profiles[0]));
    }
  } catch (err) {
    console.log('❌ Could not check profiles structure');
  }

  // Check brands table structure  
  console.log('\n🎨 Checking brands table structure...');
  try {
    const { data: brands } = await supabase
      .from('brands')
      .select('*')
      .limit(1);
      
    if (brands && brands.length > 0) {
      console.log('Brands columns:', Object.keys(brands[0]));
    }
  } catch (err) {
    console.log('❌ Could not check brands structure');
  }
}

auditDatabase().catch(console.error);