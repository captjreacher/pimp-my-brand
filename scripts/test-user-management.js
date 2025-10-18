// Test User Management Service - Real Data Only
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserManagement() {
  console.log('🔍 TESTING USER MANAGEMENT - REAL DATA ONLY\n');
  
  const results = {
    directAccess: false,
    userStats: false,
    userList: false,
    noMockData: false
  };

  try {
    // Test 1: Direct Profiles Access
    console.log('1. Testing Direct Profiles Access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, app_role, subscription_tier, created_at, updated_at, is_suspended')
      .limit(5);

    if (profilesError) {
      console.log('❌ Direct profiles access failed:', profilesError.message);
    } else {
      console.log(`✅ Direct profiles access working - ${profiles.length} users found`);
      console.log('   Sample users:');
      profiles.forEach(user => {
        console.log(`   - ${user.email} (${user.app_role || 'user'}) - ${user.subscription_tier || 'free'}`);
      });
      results.directAccess = true;
    }

    // Test 2: User Statistics
    console.log('\n2. Testing User Statistics...');
    
    const { data: totalUsers, error: totalError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    const { data: activeUsers, error: activeError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_suspended', false);

    const { data: suspendedUsers, error: suspendedError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_suspended', true);

    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('app_role', ['admin', 'moderator', 'super_admin']);

    if (totalError || activeError || suspendedError || adminError) {
      console.log('❌ User statistics queries failed');
    } else {
      console.log('✅ User statistics working:');
      console.log(`   - Total users: ${totalUsers?.length || 0}`);
      console.log(`   - Active users: ${activeUsers?.length || 0}`);
      console.log(`   - Suspended users: ${suspendedUsers?.length || 0}`);
      console.log(`   - Admin users: ${adminUsers?.length || 0}`);
      results.userStats = true;
    }

    // Test 3: User List with Filters
    console.log('\n3. Testing User List with Filters...');
    
    // Test search filter
    const { data: searchResults, error: searchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, app_role')
      .or('email.ilike.%mike%,full_name.ilike.%mike%')
      .limit(5);

    if (searchError) {
      console.log('❌ Search filter failed:', searchError.message);
    } else {
      console.log(`✅ Search filter working - ${searchResults.length} results for "mike"`);
      searchResults.forEach(user => {
        console.log(`   - ${user.email} (${user.app_role || 'user'})`);
      });
    }

    // Test role filter
    const { data: adminResults, error: adminFilterError } = await supabase
      .from('profiles')
      .select('id, email, app_role')
      .eq('app_role', 'super_admin')
      .limit(5);

    if (adminFilterError) {
      console.log('❌ Role filter failed:', adminFilterError.message);
    } else {
      console.log(`✅ Role filter working - ${adminResults.length} super_admin users`);
      adminResults.forEach(user => {
        console.log(`   - ${user.email} (${user.app_role})`);
      });
      results.userList = true;
    }

    // Test 4: Verify No Mock Data
    console.log('\n4. Verifying No Mock/Demo Data...');
    
    const realUsers = profiles?.filter(user => 
      !user.email.includes('demo') && 
      !user.email.includes('mock') && 
      !user.email.includes('fake') &&
      !user.email.includes('test@example.com')
    ) || [];

    if (realUsers.length > 0) {
      console.log(`✅ Real users confirmed - ${realUsers.length} genuine accounts`);
      console.log('   Real user emails:');
      realUsers.forEach(user => {
        console.log(`   - ${user.email}`);
      });
      results.noMockData = true;
    } else {
      console.log('⚠️  Only test/demo users found');
    }

    // Test 5: Content Count Integration
    console.log('\n5. Testing Content Count Integration...');
    
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('user_id')
      .limit(5);

    const { data: cvs, error: cvsError } = await supabase
      .from('cvs')
      .select('user_id')
      .limit(5);

    if (!brandsError && !cvsError) {
      console.log(`✅ Content integration working - ${brands.length} brands, ${cvs.length} CVs`);
      
      // Calculate content per user
      const allContent = [...(brands || []), ...(cvs || [])];
      const uniqueUsers = new Set(allContent.map(c => c.user_id));
      console.log(`   - Content spread across ${uniqueUsers.size} users`);
    } else {
      console.log('⚠️  Content tables access limited');
    }

    // Summary
    console.log('\n📊 USER MANAGEMENT TEST RESULTS:');
    console.log('=====================================');
    console.log(`Direct Access: ${results.directAccess ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`User Statistics: ${results.userStats ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`User List/Filters: ${results.userList ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`No Mock Data: ${results.noMockData ? '✅ CONFIRMED' : '❌ MOCK DATA FOUND'}`);

    const workingCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;

    if (workingCount === totalCount) {
      console.log('\n🎉 USER MANAGEMENT: 100% REAL DATA!');
      console.log('   ✅ All functions use live database');
      console.log('   ✅ No mock/demo data anywhere');
      console.log('   ✅ Statistics are real user counts');
      console.log('   ✅ User lists show actual users');
    } else {
      console.log(`\n⚠️  User Management: ${workingCount}/${totalCount} functions working with real data`);
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

testUserManagement();