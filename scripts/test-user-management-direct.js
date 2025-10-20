// Test the user management service directly to see what's happening
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read environment variables
const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the exact getUserList call from userManagementService
async function testGetUserList() {
  console.log('🎯 TESTING USER MANAGEMENT SERVICE DIRECTLY\n');

  try {
    // Test 1: Try RPC function first (this will likely fail)
    console.log('1. Testing RPC function get_admin_user_list...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_user_list', {
      p_search: null,
      p_role_filter: 'all',
      p_status_filter: 'all',
      p_limit: 50,
      p_offset: 0
    });

    if (rpcError) {
      console.log('❌ RPC function failed:', rpcError.message);
      console.log('   This is expected - falling back to direct profiles access...\n');
    } else {
      console.log('✅ RPC function worked:', rpcData);
      return { users: rpcData, isUsingDemoData: false };
    }

    // Test 2: Direct profiles access (fallback)
    console.log('2. Testing direct profiles access...');
    let query = supabase
      .from('profiles')
      .select('id, email, full_name, app_role, subscription_tier, created_at, updated_at, is_suspended, suspended_at, suspended_by, suspension_reason, admin_notes, last_admin_action');

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(0, 49); // 0 to 49 = 50 items

    const { data: profilesData, error: profilesError } = await query;
    
    if (profilesError) {
      console.log('❌ Direct profiles access failed:', profilesError.message);
      console.log('   This means the service will return empty array and set isUsingDemoData = true');
      return { users: [], isUsingDemoData: true };
    }

    console.log('✅ Direct profiles access worked!');
    console.log(`   Found ${profilesData.length} users`);
    
    // Convert profiles data to AdminUserView format
    const convertedData = profilesData?.map(profile => ({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      app_role: profile.app_role || 'user',
      subscription_tier: profile.subscription_tier || 'free',
      created_at: profile.created_at,
      last_sign_in: profile.updated_at, // Using updated_at as proxy for last activity
      is_suspended: profile.is_suspended || false,
      suspended_at: profile.suspended_at,
      suspended_by: profile.suspended_by,
      suspension_reason: profile.suspension_reason,
      admin_notes: profile.admin_notes,
      last_admin_action: profile.last_admin_action,
      content_count: 0, // Will be calculated separately if needed
      total_generations: 0
    })) || [];

    console.log('   Sample users:');
    convertedData.slice(0, 3).forEach(user => {
      console.log(`   - ${user.email} (${user.app_role}) - ${user.subscription_tier} tier`);
    });

    return { users: convertedData, isUsingDemoData: false };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { users: [], isUsingDemoData: true };
  }
}

// Test user statistics
async function testGetUserStats() {
  console.log('\n3. Testing getUserStats...');
  
  try {
    const { data: totalUsers, error: totalError } = await supabase
      .from('profiles')
      .select('id');

    if (totalError) throw totalError;

    const { data: activeUsers, error: activeError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_suspended', false);

    if (activeError) throw activeError;

    const { data: suspendedUsers, error: suspendedError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_suspended', true);

    if (suspendedError) throw suspendedError;

    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .in('app_role', ['admin', 'moderator', 'super_admin']);

    if (adminError) throw adminError;

    const today = new Date().toISOString().split('T')[0];
    const { data: newUsersToday, error: todayError } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', today);

    if (todayError) throw todayError;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: newUsersWeek, error: weekError } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', weekAgo.toISOString());

    if (weekError) throw weekError;

    const stats = {
      total_users: totalUsers?.length || 0,
      active_users: activeUsers?.length || 0,
      suspended_users: suspendedUsers?.length || 0,
      admin_users: adminUsers?.length || 0,
      new_users_today: newUsersToday?.length || 0,
      new_users_this_week: newUsersWeek?.length || 0
    };

    console.log('✅ User statistics working:', stats);
    return stats;

  } catch (error) {
    console.error('❌ User statistics failed:', error.message);
    return null;
  }
}

async function runTest() {
  const userListResult = await testGetUserList();
  const userStatsResult = await testGetUserStats();

  console.log('\n📊 USER MANAGEMENT TEST RESULTS:');
  console.log('==================================');
  console.log(`Users Found: ${userListResult.users.length}`);
  console.log(`Using Demo Data: ${userListResult.isUsingDemoData ? 'YES ❌' : 'NO ✅'}`);
  console.log(`Statistics Working: ${userStatsResult ? 'YES ✅' : 'NO ❌'}`);

  if (userListResult.isUsingDemoData) {
    console.log('\n⚠️  PROBLEM IDENTIFIED:');
    console.log('   The userManagementService is setting isUsingDemoData = true');
    console.log('   This causes the DemoDataBanner to appear in the UI');
    console.log('   Even though we have real data, the service thinks it\'s using demo data');
  } else {
    console.log('\n🎉 SUCCESS:');
    console.log('   User management is working with real data');
    console.log('   No demo data banner should appear');
  }
}

runTest();