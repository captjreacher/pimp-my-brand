// Comprehensive admin login diagnostics
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nfafvtyhmprzydxhebbm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYWZ2dHlocHJ6eWR4aGViYm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyOTAzNzI4NCwiZXhwIjoyMDQ0NjEzMjg0fQ.PEzZVjKeBzZD0-uhjHN-F8Sox9i4jDlj_NtvcUrUztQ';

async function runDiagnostics() {
  console.log('🔍 Starting Admin Login Diagnostics...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // Test 1: Check user exists and is confirmed
    console.log('1️⃣ Checking user in auth.users...');
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at, created_at')
      .eq('email', 'admin@maximisedai.com');
    
    if (usersError) {
      console.error('❌ Error querying auth.users:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No user found with email admin@maximisedai.com');
      return;
    }
    
    const user = users[0];
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      emailConfirmed: !!user.email_confirmed_at,
      created: user.created_at
    });
    
    // Test 2: Check profile exists
    console.log('\n2️⃣ Checking profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log('✅ Profile found:', profile);
    }
    
    // Test 3: Attempt login
    console.log('\n3️⃣ Testing login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@maximisedai.com',
      password: 'Temp123!'
    });
    
    if (authError) {
      console.error('❌ Login failed:', authError);
    } else {
      console.log('✅ Login successful:', {
        userId: authData.user?.id,
        email: authData.user?.email,
        sessionExists: !!authData.session
      });
      
      // Test 4: Check session user
      console.log('\n4️⃣ Checking session user...');
      const { data: sessionUser, error: sessionError } = await supabase.auth.getUser();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
      } else {
        console.log('✅ Session user:', sessionUser.user?.email);
      }
    }
    
  } catch (error) {
    console.error('💥 Diagnostic failed:', error);
  }
}

runDiagnostics();