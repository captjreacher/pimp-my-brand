// Test the complete admin authentication flow
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nfafvtyhmprzydxhebbm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYWZ2dHlocHJ6eWR4aGViYm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyOTAzNzI4NCwiZXhwIjoyMDQ0NjEzMjg0fQ.PEzZVjKeBzZD0-uhjHN-F8Sox9i4jDlj_NtvcUrUztQ';

async function testAdminFlow() {
  console.log('🧪 Testing Complete Admin Authentication Flow\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // Step 1: Login
    console.log('1️⃣ Attempting login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@maximisedai.com',
      password: 'Temp123!'
    });
    
    if (authError) {
      console.error('❌ Login failed:', authError.message);
      return;
    }
    
    console.log('✅ Login successful');
    
    // Step 2: Get current user (mimics auth service)
    console.log('\n2️⃣ Getting current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Failed to get user:', userError?.message);
      return;
    }
    
    console.log('✅ User retrieved:', user.email);
    
    // Step 3: Get profile (mimics auth service)
    console.log('\n3️⃣ Getting user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      return;
    }
    
    if (!profile) {
      console.error('❌ No profile found');
      return;
    }
    
    console.log('✅ Profile found:', {
      email: profile.email,
      app_role: profile.app_role
    });
    
    // Step 4: Check admin privileges (mimics auth service logic)
    console.log('\n4️⃣ Checking admin privileges...');
    if (!profile.app_role || profile.app_role === 'user') {
      console.error('❌ User does not have admin privileges. Role:', profile.app_role);
      return;
    }
    
    console.log('✅ Admin privileges confirmed. Role:', profile.app_role);
    
    // Step 5: Success
    console.log('\n🎉 Complete admin authentication flow successful!');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testAdminFlow();