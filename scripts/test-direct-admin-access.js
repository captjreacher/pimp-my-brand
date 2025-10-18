// Test direct admin access by signing in first
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function testDirectAdminAccess() {
  console.log('🔐 Testing direct admin access...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // Step 1: Try to sign in with admin credentials
    console.log('\n1️⃣ Attempting to sign in...');
    console.log('   (You may need to provide your actual email/password)');
    
    // You'll need to replace these with your actual credentials
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'mike@mikerobinson.co.nz', // Replace with your email
      password: 'your-password-here'     // Replace with your password
    });
    
    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      console.log('   Please update the email/password in the script');
      
      // Alternative: Check profiles directly without auth
      console.log('\n🔍 Checking profiles table directly...');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role, app_role, admin_permissions')
        .limit(5);
      
      if (profilesError) {
        console.log('❌ Profiles error:', profilesError.message);
      } else {
        console.log('✅ Found profiles:');
        console.table(profiles);
        
        const adminUsers = profiles.filter(p => 
          p.role === 'admin' || 
          p.app_role === 'admin' || 
          p.app_role === 'super_admin'
        );
        
        if (adminUsers.length > 0) {
          console.log('\n👑 Admin users found:');
          console.table(adminUsers);
        } else {
          console.log('\n⚠️  No admin users found in profiles');
        }
      }
      return;
    }
    
    console.log('✅ Sign in successful!');
    console.log('   User:', signInData.user?.email);
    
    // Step 2: Check profile after sign in
    console.log('\n2️⃣ Checking profile after sign in...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
    } else {
      console.log('✅ Profile found:');
      console.log('   Email:', profile.email);
      console.log('   Role:', profile.role);
      console.log('   App Role:', profile.app_role);
      console.log('   Admin Permissions:', profile.admin_permissions);
      
      if (profile.app_role && profile.app_role !== 'user') {
        console.log('🎉 User has admin privileges!');
      } else {
        console.log('⚠️  User does not have admin privileges');
      }
    }
    
    // Step 3: Test admin functions
    console.log('\n3️⃣ Testing admin functions...');
    const { data: logResult, error: logError } = await supabase.rpc('log_admin_action', {
      p_action_type: 'test_access',
      p_admin_user_id: signInData.user.id,
      p_details: JSON.stringify({ test: true })
    });
    
    if (logError) {
      console.log('❌ Admin function error:', logError.message);
    } else {
      console.log('✅ Admin functions working!');
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testDirectAdminAccess();