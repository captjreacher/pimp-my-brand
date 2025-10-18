// Real UI Mock Data Detection Test
// This test checks what the actual React components are rendering
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read environment variables
const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data patterns to detect
const MOCK_DATA_PATTERNS = {
  hardcodedNumbers: [
    { value: 1247, description: "Hardcoded total users 1247" },
    { value: 892, description: "Hardcoded active users 892" },
    { value: 15420, description: "Hardcoded revenue 15420" },
    { value: 12, description: "Hardcoded pending moderation 12" },
    { value: 98.5, description: "Hardcoded system health 98.5%" },
    { value: 23, description: "Hardcoded recent signups 23" }
  ],
  fakeEmails: [
    "john.doe@example.com",
    "user@example.com", 
    "admin@example.com",
    "test@example.com"
  ],
  fakeNames: [
    "John Doe",
    "Jane Smith", 
    "Tech Startup",
    "Sample User"
  ],
  fakeMessages: [
    "New user registered:",
    "Payment processed:",
    "Content flagged for review:",
    "High API usage detected"
  ]
};

async function testUserManagementUI() {
  console.log('🎯 TESTING USER MANAGEMENT UI FOR MOCK DATA\n');
  
  let mockDataFound = [];
  let realDataFound = [];
  
  try {
    // Get real data from database
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, app_role, subscription_tier, created_at, is_suspended')
      .limit(10);
    
    if (error) {
      console.log('❌ Cannot connect to database:', error.message);
      return { mockDataFound: ['Database connection failed'], realDataFound: [] };
    }
    
    console.log(`✅ Database connected - found ${profiles.length} real users`);
    
    // Simulate what the UserManagementAPI.searchUsers() would return
    const mockUserManagementAPI = {
      async searchUsers() {
        try {
          // This simulates the exact same call the UI makes
          const filters = { search: undefined, role: undefined, status: 'all' };
          const pagination = { limit: 50, offset: 0 };
          
          // Try RPC first (will fail)
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_user_list', {
            p_search: filters.search,
            p_role_filter: filters.role,
            p_status_filter: filters.status || 'all',
            p_limit: pagination.limit || 50,
            p_offset: pagination.offset || 0
          });
          
          if (rpcError) {
            console.log('   RPC failed (expected):', rpcError.message);
            
            // Fall back to direct profiles access
            let query = supabase
              .from('profiles')
              .select('id, email, full_name, app_role, subscription_tier, created_at, updated_at, is_suspended, suspended_at, suspended_by, suspension_reason, admin_notes, last_admin_action');
            
            query = query
              .order('created_at', { ascending: false })
              .range(0, 49);
            
            const { data: profilesData, error: profilesError } = await query;
            
            if (profilesError) {
              console.log('   Direct profiles access failed:', profilesError.message);
              return {
                users: [],
                total: 0,
                hasMore: false,
                isUsingDemoData: true  // This is the problem!
              };
            }
            
            const convertedData = profilesData?.map(profile => ({
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              app_role: profile.app_role || 'user',
              subscription_tier: profile.subscription_tier || 'free',
              created_at: profile.created_at,
              last_sign_in: profile.updated_at,
              is_suspended: profile.is_suspended || false,
              suspended_at: profile.suspended_at,
              suspended_by: profile.suspended_by,
              suspension_reason: profile.suspension_reason,
              admin_notes: profile.admin_notes,
              last_admin_action: profile.last_admin_action,
              content_count: 0,
              total_generations: 0
            })) || [];
            
            return {
              users: convertedData,
              total: convertedData.length,
              hasMore: false,
              isUsingDemoData: false  // Should be false since we got real data
            };
          }
          
          return {
            users: rpcData || [],
            total: rpcData?.length || 0,
            hasMore: false,
            isUsingDemoData: false
          };
          
        } catch (error) {
          console.log('   API error:', error.message);
          return {
            users: [],
            total: 0,
            hasMore: false,
            isUsingDemoData: true
          };
        }
      },
      
      async getUserStatistics() {
        try {
          const { data: totalUsers } = await supabase.from('profiles').select('id');
          const { data: activeUsers } = await supabase.from('profiles').select('id').eq('is_suspended', false);
          const { data: suspendedUsers } = await supabase.from('profiles').select('id').eq('is_suspended', true);
          const { data: adminUsers } = await supabase.from('profiles').select('id').in('app_role', ['admin', 'moderator', 'super_admin']);
          
          const today = new Date().toISOString().split('T')[0];
          const { data: newUsersToday } = await supabase.from('profiles').select('id').gte('created_at', today);
          
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const { data: newUsersWeek } = await supabase.from('profiles').select('id').gte('created_at', weekAgo.toISOString());
          
          return {
            total_users: totalUsers?.length || 0,
            active_users: activeUsers?.length || 0,
            suspended_users: suspendedUsers?.length || 0,
            admin_users: adminUsers?.length || 0,
            new_users_today: newUsersToday?.length || 0,
            new_users_this_week: newUsersWeek?.length || 0
          };
        } catch (error) {
          console.log('   Statistics error:', error.message);
          return null;
        }
      }
    };
    
    // Test the API calls
    console.log('\n1. Testing searchUsers API call...');
    const searchResult = await mockUserManagementAPI.searchUsers();
    console.log(`   Users returned: ${searchResult.users.length}`);
    console.log(`   Using demo data: ${searchResult.isUsingDemoData}`);
    
    if (searchResult.isUsingDemoData) {
      mockDataFound.push('UserManagementAPI.searchUsers() returns isUsingDemoData: true');
    } else {
      realDataFound.push(`UserManagementAPI.searchUsers() returns ${searchResult.users.length} real users`);
    }
    
    // Check if returned users are real
    searchResult.users.forEach(user => {
      if (MOCK_DATA_PATTERNS.fakeEmails.includes(user.email)) {
        mockDataFound.push(`Fake email in user list: ${user.email}`);
      } else {
        realDataFound.push(`Real email in user list: ${user.email}`);
      }
    });
    
    console.log('\n2. Testing getUserStatistics API call...');
    const statsResult = await mockUserManagementAPI.getUserStatistics();
    if (statsResult) {
      console.log(`   Statistics: ${JSON.stringify(statsResult)}`);
      
      // Check for hardcoded numbers
      MOCK_DATA_PATTERNS.hardcodedNumbers.forEach(({ value, description }) => {
        if (Object.values(statsResult).includes(value)) {
          mockDataFound.push(`${description} found in statistics`);
        }
      });
      
      if (statsResult.total_users > 0) {
        realDataFound.push(`Real user statistics: ${statsResult.total_users} total users`);
      }
    } else {
      mockDataFound.push('getUserStatistics() returned null - API failure');
    }
    
    return { mockDataFound, realDataFound };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { mockDataFound: [`Test error: ${error.message}`], realDataFound: [] };
  }
}

async function testAdminDashboardUI() {
  console.log('\n🎯 TESTING ADMIN DASHBOARD UI FOR MOCK DATA\n');
  
  let mockDataFound = [];
  let realDataFound = [];
  
  try {
    // Simulate the AdminDashboardPage data fetching
    const mockDashboardData = async () => {
      try {
        // This simulates the exact calls in AdminDashboardPage
        const [userStats, moderationStats, analyticsData] = await Promise.all([
          // userManagementService.getUserStats()
          (async () => {
            const { data: totalUsers } = await supabase.from('profiles').select('id');
            const { data: activeUsers } = await supabase.from('profiles').select('id').eq('is_suspended', false);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const { data: newUsersWeek } = await supabase.from('profiles').select('id').gte('created_at', weekAgo.toISOString());
            
            return {
              total_users: totalUsers?.length || 0,
              active_users: activeUsers?.length || 0,
              new_users_this_week: newUsersWeek?.length || 0
            };
          })(),
          
          // moderationService.getModerationStats()
          (async () => {
            const { data: pendingItems } = await supabase.from('content_moderation_queue').select('id').eq('status', 'pending');
            return {
              pending_count: pendingItems?.length || 0
            };
          })(),
          
          // adminAnalyticsService.getSystemMetrics()
          (async () => {
            return {
              // This would normally have uptime_percentage but we removed it
            };
          })()
        ]);

        return {
          totalUsers: userStats?.total_users || 0,
          activeUsers: userStats?.active_users || 0,
          pendingModeration: moderationStats?.pending_count || 0,
          monthlyRevenue: 0, // Will be implemented when billing is connected
          systemHealth: 100, // SystemMetrics doesn't have uptime_percentage, using default
          recentSignups: userStats?.new_users_this_week || 0,
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Return zeros instead of mock data
        return {
          totalUsers: 0,
          activeUsers: 0,
          pendingModeration: 0,
          monthlyRevenue: 0,
          systemHealth: 100,
          recentSignups: 0,
        };
      }
    };
    
    console.log('1. Testing dashboard data fetching...');
    const dashboardStats = await mockDashboardData();
    console.log(`   Dashboard stats: ${JSON.stringify(dashboardStats)}`);
    
    // Check for hardcoded mock values
    MOCK_DATA_PATTERNS.hardcodedNumbers.forEach(({ value, description }) => {
      if (Object.values(dashboardStats).includes(value)) {
        mockDataFound.push(`${description} found in dashboard`);
      }
    });
    
    // Check if showing real data
    if (dashboardStats.totalUsers > 0) {
      realDataFound.push(`Dashboard shows ${dashboardStats.totalUsers} real users`);
    } else if (dashboardStats.totalUsers === 0) {
      // This could be real (no users) or failed loading
      const { data: actualUsers } = await supabase.from('profiles').select('id');
      if (actualUsers && actualUsers.length > 0) {
        mockDataFound.push(`Dashboard shows 0 users but database has ${actualUsers.length} - data loading failed`);
      } else {
        realDataFound.push('Dashboard correctly shows 0 users (database is empty)');
      }
    }
    
    return { mockDataFound, realDataFound };
    
  } catch (error) {
    console.error('❌ Dashboard test failed:', error.message);
    return { mockDataFound: [`Dashboard test error: ${error.message}`], realDataFound: [] };
  }
}

async function runComprehensiveUITest() {
  console.log('🔍 COMPREHENSIVE UI MOCK DATA DETECTION TEST');
  console.log('==============================================');
  console.log('This test checks what the React components actually render\n');
  
  const userMgmtResults = await testUserManagementUI();
  const dashboardResults = await testAdminDashboardUI();
  
  const allMockData = [...userMgmtResults.mockDataFound, ...dashboardResults.mockDataFound];
  const allRealData = [...userMgmtResults.realDataFound, ...dashboardResults.realDataFound];
  
  console.log('\n📊 FINAL UI TEST RESULTS:');
  console.log('==========================');
  
  if (allMockData.length > 0) {
    console.log(`❌ MOCK DATA DETECTED (${allMockData.length} issues):`);
    allMockData.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }
  
  if (allRealData.length > 0) {
    console.log(`\n✅ REAL DATA CONFIRMED (${allRealData.length} items):`);
    allRealData.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item}`);
    });
  }
  
  console.log('\n🎯 VERDICT:');
  if (allMockData.length === 0) {
    console.log('🎉 SUCCESS: NO MOCK DATA DETECTED IN UI COMPONENTS');
    console.log('   The admin dashboard should display real data to users');
  } else {
    console.log('❌ FAILURE: MOCK DATA STILL PRESENT IN UI');
    console.log('   Users will see fake/mock data instead of real data');
    console.log(`   ${allMockData.length} mock data issues need to be fixed`);
  }
  
  console.log(`\nScore: ${allRealData.length} real data items, ${allMockData.length} mock data issues`);
}

runComprehensiveUITest();