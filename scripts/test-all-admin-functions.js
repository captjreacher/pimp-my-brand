// Comprehensive test for ALL admin functions with real data
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read environment variables
const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllAdminFunctions() {
  console.log('🔍 Testing ALL admin functions with real data...\n');
  
  const results = {
    userManagement: false,
    analytics: false,
    moderation: false,
    performance: false,
    database: false
  };

  try {
    // Test 1: User Management
    console.log('1. Testing User Management...');
    const { data: users, error: usersError } = await supabase.rpc('get_admin_user_list', {
      p_search: null,
      p_role_filter: 'all',
      p_status_filter: 'all',
      p_limit: 10,
      p_offset: 0
    });

    if (usersError) {
      console.log('❌ User management RPC failed:', usersError.message);
    } else {
      console.log(`✅ User management working - ${users.length} users found`);
      results.userManagement = true;
    }

    // Test 2: Analytics Functions
    console.log('\n2. Testing Analytics Functions...');
    
    // Test user statistics
    const { data: userStats, error: userStatsError } = await supabase.rpc('get_user_statistics', {
      time_range: '24 hours'
    });

    if (userStatsError) {
      console.log('❌ User statistics failed:', userStatsError.message);
    } else {
      console.log('✅ User statistics working:', userStats);
      results.analytics = true;
    }

    // Test content statistics
    const { data: contentStats, error: contentStatsError } = await supabase.rpc('get_content_statistics', {
      time_range: '24 hours'
    });

    if (contentStatsError) {
      console.log('❌ Content statistics failed:', contentStatsError.message);
    } else {
      console.log('✅ Content statistics working:', contentStats);
    }

    // Test performance statistics
    const { data: perfStats, error: perfStatsError } = await supabase.rpc('get_performance_statistics', {
      time_range: '24 hours'
    });

    if (perfStatsError) {
      console.log('❌ Performance statistics failed:', perfStatsError.message);
    } else {
      console.log('✅ Performance statistics working:', perfStats);
      results.performance = true;
    }

    // Test 3: Moderation Functions
    console.log('\n3. Testing Moderation Functions...');
    const { data: modStats, error: modStatsError } = await supabase.rpc('get_moderation_statistics', {
      time_range: '24 hours'
    });

    if (modStatsError) {
      console.log('❌ Moderation statistics failed:', modStatsError.message);
    } else {
      console.log('✅ Moderation statistics working:', modStats);
      results.moderation = true;
    }

    // Test 4: Database Tables Access
    console.log('\n4. Testing Database Tables...');
    
    const tables = ['profiles', 'brands', 'cvs', 'admin_metrics', 'system_health_metrics', 'content_moderation_queue'];
    let tablesWorking = 0;

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table} access failed:`, error.message);
      } else {
        console.log(`✅ Table ${table} accessible`);
        tablesWorking++;
      }
    }

    results.database = tablesWorking === tables.length;

    // Test 5: Admin User Check
    console.log('\n5. Testing Admin User Access...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('email, app_role, admin_permissions')
      .in('app_role', ['admin', 'super_admin', 'moderator']);

    if (adminError) {
      console.log('❌ Admin user check failed:', adminError.message);
    } else {
      console.log('✅ Admin users found:');
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.app_role})`);
      });
    }

    // Summary
    console.log('\n📊 ADMIN FUNCTIONS TEST SUMMARY:');
    console.log('=====================================');
    console.log(`User Management: ${results.userManagement ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Analytics: ${results.analytics ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Moderation: ${results.moderation ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Performance: ${results.performance ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Database: ${results.database ? '✅ WORKING' : '❌ FAILED'}`);

    const workingCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;

    if (workingCount === totalCount) {
      console.log('\n🎉 ALL ADMIN FUNCTIONS ARE WORKING WITH REAL DATA!');
      console.log('   No more mock/demo data - everything is connected to your database.');
    } else {
      console.log(`\n⚠️  ${workingCount}/${totalCount} admin functions working.`);
      console.log('   Some functions may need the complete SQL script to be run.');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

testAllAdminFunctions();