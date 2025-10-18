// Debug admin loading issue
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function debugAdminLoading() {
  console.log('🔍 Debugging admin loading issue...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // Step 1: Check current auth status
    console.log('\n1️⃣ Checking current auth status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
      return;
    } else if (user) {
      console.log('✅ User authenticated:', user.email);
      console.log('   User ID:', user.id);
    } else {
      console.log('❌ No user authenticated');
      return;
    }
    
    // Step 2: Check user profile
    console.log('\n2️⃣ Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
      console.log('   This means the user has no profile in the profiles table');
    } else {
      console.log('✅ Profile found:');
      console.log('   Email:', profile.email);
      console.log('   Role (old):', profile.role);
      console.log('   App Role (new):', profile.app_role);
      console.log('   Admin Permissions:', profile.admin_permissions);
      console.log('   Full Profile:', JSON.stringify(profile, null, 2));
    }
    
    // Step 3: Check if app_role column exists
    console.log('\n3️⃣ Checking if app_role column exists...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public')
      .in('column_name', ['role', 'app_role']);
    
    if (columnsError) {
      console.log('❌ Error checking columns:', columnsError.message);
    } else {
      console.log('✅ Profile table columns:');
      console.table(columns);
    }
    
    // Step 4: Check admin functions
    console.log('\n4️⃣ Testing admin functions...');
    try {
      const { data: logResult, error: logError } = await supabase.rpc('log_admin_action', {
        p_action_type: 'debug_test',
        p_admin_user_id: user.id,
        p_details: JSON.stringify({ test: 'debug' })
      });
      
      if (logError) {
        console.log('❌ Admin function error:', logError.message);
      } else {
        console.log('✅ Admin functions working');
      }
    } catch (err) {
      console.log('❌ Admin function test failed:', err.message);
    }
    
    // Step 5: Summary and recommendations
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    
    if (!profile) {
      console.log('🚨 ISSUE: User has no profile in profiles table');
      console.log('   SOLUTION: Create a profile for this user');
    } else if (!profile.app_role) {
      console.log('🚨 ISSUE: User profile has no app_role column');
      console.log('   SOLUTION: Run the role column mismatch fix');
    } else if (profile.app_role === 'user') {
      console.log('🚨 ISSUE: User has app_role = "user" (not admin)');
      console.log('   SOLUTION: Update user to admin role');
    } else {
      console.log('✅ User profile looks correct for admin access');
      console.log('   The issue might be in the frontend admin loading logic');
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

debugAdminLoading();