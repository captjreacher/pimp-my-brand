// Test what the admin dashboard is actually showing
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read environment variables
const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardData() {
  console.log('🎯 TESTING ADMIN DASHBOARD DATA DISPLAY\n');

  try {
    // Test 1: User Statistics (what the dashboard shows)
    console.log('1. Testing User Statistics for Dashboard...');
    
    const { data: totalUsers, error: totalError } = await supabase
      .from('profiles')
      .select('id');

    const { data: activeUsers, error: activeError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_suspended', false);

    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .in('app_role', ['admin', 'moderator', 'super_admin']);

    const today = new Date().toISOString().split('T')[0];
    const { data: newUsersToday, error: todayError } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', today);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: newUsersWeek, error: weekError } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', weekAgo.toISOString());

    if (totalError || activeError || adminError || todayError || weekError) {
      console.log('❌ User statistics failed:', {
        totalError: totalError?.message,
        activeError: activeError?.message,
        adminError: adminError?.message,
        todayError: todayError?.message,
        weekError: weekError?.message
      });
    } else {
      console.log('✅ User Statistics Working:');
      console.log(`   - Total Users: ${totalUsers?.length || 0}`);
      console.log(`   - Active Users: ${activeUsers?.length || 0}`);
      console.log(`   - Admin Users: ${adminUsers?.length || 0}`);
      console.log(`   - New Users Today: ${newUsersToday?.length || 0}`);
      console.log(`   - New Users This Week: ${newUsersWeek?.length || 0}`);
    }

    // Test 2: Content Statistics
    console.log('\n2. Testing Content Statistics...');
    
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id');

    const { data: cvs, error: cvsError } = await supabase
      .from('cvs')
      .select('id');

    if (brandsError || cvsError) {
      console.log('❌ Content statistics failed:', {
        brandsError: brandsError?.message,
        cvsError: cvsError?.message
      });
    } else {
      console.log('✅ Content Statistics Working:');
      console.log(`   - Total Brands: ${brands?.length || 0}`);
      console.log(`   - Total CVs: ${cvs?.length || 0}`);
      console.log(`   - Total Content: ${(brands?.length || 0) + (cvs?.length || 0)}`);
    }

    // Test 3: Moderation Queue
    console.log('\n3. Testing Moderation Queue...');
    
    const { data: modQueue, error: modError } = await supabase
      .from('content_moderation_queue')
      .select('*');

    if (modError) {
      console.log('❌ Moderation queue failed:', modError.message);
    } else {
      console.log('✅ Moderation Queue Working:');
      console.log(`   - Pending Items: ${modQueue?.length || 0}`);
    }

    // Test 4: System Health
    console.log('\n4. Testing System Health...');
    
    const { data: healthMetrics, error: healthError } = await supabase
      .from('system_health_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (healthError) {
      console.log('❌ System health failed:', healthError.message);
    } else {
      console.log('✅ System Health Working:');
      console.log(`   - Health Records: ${healthMetrics?.length || 0}`);
      if (healthMetrics?.[0]) {
        console.log(`   - Latest Uptime: ${healthMetrics[0].uptime_percentage || 'N/A'}%`);
        console.log(`   - Response Time: ${healthMetrics[0].avg_response_time || 'N/A'}ms`);
      }
    }

    // Test 5: Sample User Data
    console.log('\n5. Sample User Data...');
    
    const { data: sampleUsers, error: sampleError } = await supabase
      .from('profiles')
      .select('email, app_role, subscription_tier, created_at')
      .limit(3);

    if (sampleError) {
      console.log('❌ Sample users failed:', sampleError.message);
    } else {
      console.log('✅ Sample Users:');
      sampleUsers?.forEach(user => {
        console.log(`   - ${user.email} (${user.app_role}) - ${user.subscription_tier} tier`);
      });
    }

    console.log('\n📊 DASHBOARD DATA SUMMARY:');
    console.log('============================');
    console.log('This is the ACTUAL data your admin dashboard should display.');
    console.log('If you see zeros or mock data in the UI, there\'s a frontend issue.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDashboardData();