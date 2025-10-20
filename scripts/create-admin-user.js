// Create admin user using Supabase signup
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nfafvtyhmprzydxhebbm.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYWZ2dHlocHJ6eWR4aGViYm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyOTAzNzI4NCwiZXhwIjoyMDQ0NjEzMjg0fQ.PEzZVjKeBzZD0-uhjHN-F8Sox9i4jDlj_NtvcUrUztQ';

async function createAdminUser() {
  console.log('🔧 Creating Admin User via Supabase Signup\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // Step 1: Sign up the admin user
    console.log('1️⃣ Signing up admin user...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'admin@maximisedai.com',
      password: 'Admin123!',
      options: {
        data: {
          full_name: 'System Administrator'
        }
      }
    });

    if (signupError) {
      console.error('❌ Signup failed:', signupError.message);
      return false;
    }

    if (!signupData.user) {
      console.error('❌ No user data returned from signup');
      return false;
    }

    console.log('✅ Admin user signed up:', {
      id: signupData.user.id,
      email: signupData.user.email,
      confirmed: signupData.user.email_confirmed_at ? 'Yes' : 'No'
    });

    // Step 2: If email confirmation is required, we need to confirm it manually
    if (!signupData.user.email_confirmed_at) {
      console.log('\n2️⃣ Email confirmation required - attempting manual confirmation...');

      // For development, we'll try to confirm the email directly in the database
      // This requires service role key, so we'll provide instructions instead
      console.log('⚠️  Email confirmation needed. Please run this SQL in Supabase:');
      console.log(`UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = '${signupData.user.id}';`);
      console.log('Then run this script again to verify.');
      return false;
    }

    // Step 3: Verify the profile was created with correct role
    console.log('\n3️⃣ Verifying admin profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signupData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile verification failed:', profileError.message);
      return false;
    }

    console.log('✅ Profile verified:', {
      email: profile.email,
      role: profile.app_role,
      name: profile.full_name
    });

    if (profile.app_role !== 'super_admin') {
      console.log('⚠️  Role is not super_admin. The trigger should have set this automatically.');
      console.log('This might indicate the trigger didn\'t work as expected.');
      return false;
    }

    // Step 4: Test login
    console.log('\n4️⃣ Testing admin login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@maximisedai.com',
      password: 'Admin123!'
    });

    if (loginError) {
      console.error('❌ Login test failed:', loginError.message);
      return false;
    }

    console.log('✅ Login test successful');

    // Step 5: Test admin functions
    console.log('\n5️⃣ Testing admin functions...');
    const { data: isAdminResult, error: isAdminError } = await supabase
      .rpc('is_admin', { user_id: loginData.user.id });

    if (isAdminError) {
      console.error('❌ Admin function test failed:', isAdminError.message);
      return false;
    }

    if (!isAdminResult) {
      console.error('❌ is_admin function returned false for admin user');
      return false;
    }

    console.log('✅ Admin functions working');

    console.log('\n🎉 ADMIN USER CREATION SUCCESSFUL!');
    console.log('\n📋 ADMIN CREDENTIALS:');
    console.log('Email: admin@maximisedai.com');
    console.log('Password: Admin123!');
    console.log('Role: super_admin');

    return true;

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    return false;
  }
}

// Run the creation
createAdminUser().then(success => {
  if (success) {
    console.log('\n🚀 Admin user is ready to use!');
    process.exit(0);
  } else {
    console.log('\n❌ Admin user creation failed. Check the errors above.');
    process.exit(1);
  }
});