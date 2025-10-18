// Test the exact same calls that the AdminDashboardPage makes
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read environment variables
const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the userManagementService.getUserStats() call
async function getUserStats() {
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

    return {
      total_users: totalUsers?.length || 0,
      active_users: activeUsers?.length || 0,
      suspended_users: suspendedUsers?.length || 0,
      admin_users: adminUsers?.length || 0,
      new_users_today: newUsersToday?.length || 0,
      new_users_this_week: newUsersWeek?.length || 0
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return null;
  }
}

// Simulate the moderationService.getModerationStats() call
async function getModerationStats() {
  try {
    const { data: pendingItems, error: pendingError } = await supabase
      .from('content_moderation_queue')
      .select('id')
      .eq('status', 'pending');

    if (pendingError) throw pendingError;

    const { data: approvedItems, error: approvedError } = await supabase
      .from('content_moderation_queue')
      .select('id')
      .eq('status', 'approved');

    if (approvedError) throw approvedError;

    return {
      pending_count: pendingItems?.length || 0,
      approved_count: approvedItems?.length || 0,
      rejected_count: 0,
      escalated_count: 0,
      total_processed_today: 0,
      avg_processing_time_hours: 0,
      high_priority_count: 0
    };
  } catch (error) {
    console.error('Error in getModerationStats:', error);
    return null;
  }
}

// Simulate the adminAnalyticsService.getSystemMetrics() call
async function getSystemMetrics() {
  try {
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');

    if (usersError) throw usersError;

    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id');

    if (brandsError) throw brandsError;

    const { data: cvs, error: cvsError } = await supabase
      .from('cvs')
      .select('id');

    if (cvsError) throw cvsError;

    return {
      active_users_24h: users?.length || 0,
      total_users: users?.length || 0,
      new_users_period: 0,
      total_content_generated: (brands?.length || 0) + (cvs?.length || 0),
      content_created_period: 0,
      api_requests_24h: 0,
      storage_usage: 0,
      ai_api_costs: 0,
      users_by_tier: { free: users?.length || 0 },
      content_by_type: {
        brands: brands?.length || 0,
        cvs: cvs?.length || 0
      },
      avg_content_per_user: users?.length ? ((brands?.length || 0) + (cvs?.length || 0)) / users.length : 0
    };
  } catch (error) {
    console.error('Error in getSystemMetrics:', error);
    return null;
  }
}

async function testDashboardServices() {
  console.log('🎯 TESTING ADMIN DASHBOARD SERVICES\n');

  try {
    console.log('1. Testing userManagementService.getUserStats()...');
    const userStats = await getUserStats();
    if (userStats) {
      console.log('✅ User Stats:', userStats);
    } else {
      console.log('❌ User Stats failed');
    }

    console.log('\n2. Testing moderationService.getModerationStats()...');
    const moderationStats = await getModerationStats();
    if (moderationStats) {
      console.log('✅ Moderation Stats:', moderationStats);
    } else {
      console.log('❌ Moderation Stats failed');
    }

    console.log('\n3. Testing adminAnalyticsService.getSystemMetrics()...');
    const analyticsData = await getSystemMetrics();
    if (analyticsData) {
      console.log('✅ Analytics Data:', analyticsData);
    } else {
      console.log('❌ Analytics Data failed');
    }

    console.log('\n📊 DASHBOARD WOULD SHOW:');
    console.log('========================');
    if (userStats && moderationStats && analyticsData) {
      const dashboardData = {
        totalUsers: userStats.total_users || 0,
        activeUsers: userStats.active_users || 0,
        pendingModeration: moderationStats.pending_count || 0,
        monthlyRevenue: 0,
        systemHealth: 100,
        recentSignups: userStats.new_users_this_week || 0,
      };
      
      console.log('Dashboard Stats:', dashboardData);
      
      if (dashboardData.totalUsers > 0) {
        console.log('\n🎉 SUCCESS: Dashboard will show REAL DATA!');
      } else {
        console.log('\n⚠️  WARNING: Dashboard will show zeros (but no mock data)');
      }
    } else {
      console.log('❌ Dashboard will show error fallback (zeros)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDashboardServices();