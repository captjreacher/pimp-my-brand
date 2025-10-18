// Test script for simple nuclear reset verification
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nfafvtyhmprzydxhebbm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYWZ2dHlocHJ6eWR4aGViYm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyOTAzNzI4NCwiZXhwIjoyMDQ0NjEzMjg0fQ.PEzZVjKeBzZD0-uhjHN-F8Sox9i4jDlj_NtvcUrUztQ';

async function testSimpleReset() {
  console.log('🧪 Testing Simple Nuclear Reset and Admin Setup\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // Test 1: Database connection
    console.log('1️⃣ Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      return false;
    }
    console.log('✅ Database connection successful');
    
    // Test 2: Check if admin user exists
    console.log('\n2️⃣ Checking admin user existence...');
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@maximisedai.com')
      .single();
    
    if (adminCheckError) {
      if (adminCheckError.code === 'PGRST116') {
        console.log('ℹ️  Admin user not found - this is expected after database reset');
        console.log('   Run: node scripts/create-admin-user.js to create the admin user');
        return false;
      }
      console.error('❌ Error checking admin user:', adminCheckError.message);
      return false;
    }
    
    console.log('✅ Admin user found:', {
      id: adminCheck.id,
      email: adminCheck.email,
      role: adminCheck.app_role,
      name: adminCheck.full_name
    });
    
    // Test 3: Admin login
    console.log('\n3️⃣ Testing admin login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@maximisedai.com',
      password: 'Admin123!'
    });
    
    if (authError) {
      console.error('❌ Login failed:', authError.message);
      return false;
    }
    
    if (!authData.user) {
      console.error('❌ No user data returned from login');
      return false;
    }
    
    console.log('✅ Login successful:', {
      id: authData.user.id,
      email: authData.user.email,
      confirmed: authData.user.email_confirmed_at ? 'Yes' : 'No'
    });
    
    // Test 4: Profile access with authentication
    console.log('\n4️⃣ Testing authenticated profile access...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile access failed:', profileError.message);
      return false;
    }
    
    console.log('✅ Profile access successful:', {
      email: profile.email,
      role: profile.app_role,
      name: profile.full_name
    });
    
    // Test 5: Admin privileges verification
    console.log('\n5️⃣ Verifying admin privileges...');
    if (profile.app_role !== 'super_admin') {
      console.error('❌ Incorrect admin role. Expected: super_admin, Got:', profile.app_role);
      return false;
    }
    console.log('✅ Admin privileges confirmed');
    
    // Test 6: Admin session creation
    console.log('\n6️⃣ Testing admin session creation...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        user_id: authData.user.id,
        ip_address: '127.0.0.1',
        user_agent: 'Test Script'
      })
      .select()
      .single();
    
    if (sessionError) {
      console.error('❌ Session creation failed:', sessionError.message);
      return false;
    }
    console.log('✅ Admin session created:', sessionData.id);
    
    // Test 7: Audit log creation
    console.log('\n7️⃣ Testing audit log creation...');
    const { data: auditData, error: auditError } = await supabase
      .from('admin_audit_logs')
      .insert({
        user_id: authData.user.id,
        action: 'TEST_LOGIN',
        resource_type: 'admin_test',
        resource_id: 'test_script',
        details: { test: true, timestamp: new Date().toISOString() }
      })
      .select()
      .single();
    
    if (auditError) {
      console.error('❌ Audit log creation failed:', auditError.message);
      return false;
    }
    console.log('✅ Audit log created:', auditData.id);
    
    // Test 8: Helper functions
    console.log('\n8️⃣ Testing helper functions...');
    const { data: isAdminResult, error: isAdminError } = await supabase
      .rpc('is_admin', { user_id: authData.user.id });
    
    if (isAdminError) {
      console.error('❌ Helper function test failed:', isAdminError.message);
      return false;
    }
    
    if (!isAdminResult) {
      console.error('❌ is_admin function returned false for admin user');
      return false;
    }
    console.log('✅ Helper functions working');
    
    // Cleanup test data
    await supabase.from('admin_sessions').delete().eq('id', sessionData.id);
    await supabase.from('admin_audit_logs').delete().eq('id', auditData.id);
    
    console.log('\n🎉 ALL TESTS PASSED! Simple reset successful.');
    console.log('\n📋 SUMMARY:');
    console.log('✅ Database connection working');
    console.log('✅ Admin user created and confirmed');
    console.log('✅ Login authentication working');
    console.log('✅ Profile access working');
    console.log('✅ Admin privileges correct');
    console.log('✅ Admin sessions working');
    console.log('✅ Audit logging working');
    console.log('✅ Helper functions working');
    
    return true;
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    return false;
  }
}

// Run the test
testSimpleReset().then(success => {
  if (success) {
    console.log('\n🚀 Ready to use admin system!');
    process.exit(0);
  } else {
    console.log('\n❌ Setup verification failed. Check the errors above.');
    process.exit(1);
  }
});