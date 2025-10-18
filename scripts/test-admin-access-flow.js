// Test admin access flow
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function testAdminFlow() {
  console.log('Testing admin access flow...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // Step 1: Check current auth status
    console.log('\n1. Checking current auth status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
    } else if (user) {
      console.log('✅ User authenticated:', user.email);
      console.log('User ID:', user.id);
    } else {
      console.log('⚠️  No user authenticated');
    }
    
    // Step 2: Check if profiles table exists and has data
    console.log('\n2. Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, app_role, admin_permissions')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible');
      console.log('Total profiles found:', profiles.length);
      console.table(profiles);
    }
    
    // Step 3: Check for admin users specifically
    console.log('\n3. Checking for admin users...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('id, email, app_role, admin_permissions')
      .in('app_role', ['admin', 'super_admin', 'moderator']);
    
    if (adminError) {
      console.log('❌ Admin users error:', adminError.message);
    } else {
      console.log('✅ Admin users query successful');
      console.log('Admin users found:', adminUsers.length);
      if (adminUsers.length > 0) {
        console.table(adminUsers);
      } else {
        console.log('⚠️  No admin users found in database');
      }
    }
    
    // Step 4: Check if current user has admin profile
    if (user) {
      console.log('\n4. Checking current user admin status...');
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('id, email, app_role, admin_permissions')
        .eq('id', user.id)
        .single();
      
      if (userProfileError) {
        console.log('❌ User profile error:', userProfileError.message);
        console.log('This means the current user has no profile in the profiles table');
      } else {
        console.log('✅ User profile found');
        console.log('Profile data:', userProfile);
        
        if (userProfile.app_role && userProfile.app_role !== 'user') {
          console.log('🎉 User has admin privileges:', userProfile.app_role);
        } else {
          console.log('⚠️  User does not have admin privileges');
        }
      }
    }
    
    // Step 5: Check admin functions
    console.log('\n5. Checking admin functions...');
    const { data: functions, error: functionsError } = await supabase.rpc('log_admin_action', {
      p_action_type: 'test_access',
      p_admin_user_id: user?.id || 'test-id',
      p_target_type: 'test',
      p_target_id: 'test-target',
      p_details: JSON.stringify({ test: true }),
      p_user_agent: 'test-agent'
    });
    
    if (functionsError) {
      console.log('❌ Admin functions error:', functionsError.message);
    } else {
      console.log('✅ Admin functions working');
    }
    
    // Step 6: Summary and recommendations
    console.log('\n📋 SUMMARY AND RECOMMENDATIONS:');
    
    if (!user) {
      console.log('🔑 You need to sign in first');
      console.log('   → Go to /auth and create an account or sign in');
    } else if (adminUsers.length === 0) {
      console.log('👤 No admin users exist in the database');
      console.log('   → Run the SQL script to create an admin user');
      console.log('   → Use: scripts/ultra-simple-admin-creation.sql');
    } else if (userProfileError) {
      console.log('📝 Current user has no profile');
      console.log('   → The user needs a profile in the profiles table');
      console.log('   → Run SQL to create profile for current user');
    } else if (!userProfile.app_role || userProfile.app_role === 'user') {
      console.log('🔐 Current user is not an admin');
      console.log('   → Update the user\'s app_role to super_admin');
      console.log('   → Run SQL: UPDATE profiles SET app_role = \'super_admin\' WHERE id = \'' + user.id + '\';');
    } else {
      console.log('✅ Everything looks good! Admin access should work.');
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testAdminFlow();