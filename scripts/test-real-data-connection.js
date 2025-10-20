// Test Real Data Connection for Admin Dashboard
// Run this after executing the SQL script

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealDataConnection() {
  console.log('🔍 Testing admin dashboard real data connection...\n');

  try {
    // Test 1: Check profiles table access
    console.log('1. Testing profiles table access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, app_role')
      .limit(5);

    if (profilesError) {
      console.log('❌ Profiles access failed:', profilesError.message);
      console.log('   This means RLS is still blocking access');
      return false;
    }

    console.log('✅ Profiles table accessible');
    console.log(`   Found ${profiles.length} users`);
    
    // Test 2: Check admin functions
    console.log('\n2. Testing admin RPC functions...');
    const { data: userList, error: rpcError } = await supabase.rpc('get_admin_user_list', {
      p_search: null,
      p_role_filter: 'all',
      p_status_filter: 'all',
      p_limit: 10,
      p_offset: 0
    });

    if (rpcError) {
      console.log('❌ Admin RPC function failed:', rpcError.message);
      console.log('   Admin functions may not be created properly');
      return false;
    }

    console.log('✅ Admin RPC functions working');
    console.log(`   Retrieved ${userList.length} users via RPC`);

    // Test 3: Check admin user exists
    console.log('\n3. Checking admin user...');
    const adminUsers = profiles.filter(p => 
      ['admin', 'super_admin', 'moderator'].includes(p.app_role)
    );

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found');
      console.log('   You may need to manually set your role to admin');
      return false;
    }

    console.log('✅ Admin users found:');
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.app_role})`);
    });

    // Test 4: Check content tables
    console.log('\n4. Testing content tables access...');
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, user_id')
      .limit(3);

    const { data: cvs, error: cvsError } = await supabase
      .from('cvs')
      .select('id, user_id')
      .limit(3);

    if (!brandsError) {
      console.log(`✅ Brands table accessible (${brands.length} found)`);
    } else {
      console.log('⚠️  Brands table access limited:', brandsError.message);
    }

    if (!cvsError) {
      console.log(`✅ CVs table accessible (${cvs.length} found)`);
    } else {
      console.log('⚠️  CVs table access limited:', cvsError.message);
    }

    console.log('\n🎉 Real data connection test completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Total users: ${profiles.length}`);
    console.log(`   - Admin users: ${adminUsers.length}`);
    console.log(`   - RPC functions: Working`);
    console.log(`   - Content access: ${!brandsError && !cvsError ? 'Full' : 'Limited'}`);

    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
testRealDataConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Admin dashboard should now show real data!');
      console.log('   Refresh your admin pages to see actual users.');
    } else {
      console.log('\n❌ Issues found. Please run the SQL script first.');
    }
  })
  .catch(error => {
    console.error('Test execution failed:', error);
  });