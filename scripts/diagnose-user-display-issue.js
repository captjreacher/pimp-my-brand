import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function diagnoseUserDisplayIssue() {
  console.log('🔍 Diagnosing user display issue...\n');

  try {
    // 1. Check total users in auth.users
    console.log('1. Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log('❌ Error accessing auth.users:', authError.message);
    } else {
      console.log(`✅ Total users in auth.users: ${authUsers.users.length}`);
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
      });
    }

    console.log('\n2. Checking profiles table with service role...');
    const serviceSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: allProfiles, error: serviceError } = await serviceSupabase
      .from('profiles')
      .select('id, email, full_name, app_role, created_at')
      .order('created_at', { ascending: false });

    if (serviceError) {
      console.log('❌ Error with service role:', serviceError.message);
    } else {
      console.log(`✅ Total profiles with service role: ${allProfiles.length}`);
      allProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.email} - Role: ${profile.app_role || 'user'} (ID: ${profile.id.substring(0, 8)}...)`);
      });
    }

    console.log('\n3. Checking profiles table with anon key (what the app sees)...');
    const { data: anonProfiles, error: anonError } = await supabase
      .from('profiles')
      .select('id, email, full_name, app_role, created_at')
      .order('created_at', { ascending: false });

    if (anonError) {
      console.log('❌ Error with anon key:', anonError.message);
    } else {
      console.log(`✅ Profiles visible to anon key: ${anonProfiles.length}`);
      anonProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.email} - Role: ${profile.app_role || 'user'} (ID: ${profile.id.substring(0, 8)}...)`);
      });
    }

    console.log('\n4. Checking RLS policies on profiles table...');
    const { data: policies, error: policyError } = await serviceSupabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles');

    if (policyError) {
      console.log('❌ Error checking policies:', policyError.message);
    } else {
      console.log(`✅ Found ${policies.length} RLS policies on profiles table:`);
      policies.forEach((policy, index) => {
        console.log(`   ${index + 1}. ${policy.policyname} - Command: ${policy.cmd} - Role: ${policy.roles}`);
        console.log(`      Expression: ${policy.qual || 'N/A'}`);
      });
    }

    console.log('\n5. Checking current user session...');
    const { data: session } = await supabase.auth.getSession();
    if (session.session) {
      console.log(`✅ Current user: ${session.session.user.email}`);
      console.log(`   User ID: ${session.session.user.id}`);
      
      // Check current user's profile
      const { data: currentProfile, error: currentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single();

      if (currentError) {
        console.log('❌ Error getting current user profile:', currentError.message);
      } else {
        console.log(`   Profile role: ${currentProfile.app_role || 'user'}`);
        console.log(`   Admin permissions: ${JSON.stringify(currentProfile.admin_permissions || [])}`);
      }
    } else {
      console.log('❌ No active session');
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

diagnoseUserDisplayIssue();