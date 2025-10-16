// Check database structure and policies
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nfafvtyhmprzydxhebbm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYWZ2dHlobXByenlkeGhlYmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODk1NDMsImV4cCI6MjA3NTA2NTU0M30.8fR2Z_rwHN8_BjvWvvIgxM-7YBF-otie5r4zF7RiK4M';

async function checkDatabase() {
  console.log('Checking database structure...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // Test 1: Check if we can query information_schema
    console.log('\n1. Checking table structure...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('❌ Cannot query information_schema:', tablesError.message);
    } else {
      console.log('✅ Available tables:', tables?.map(t => t.table_name));
    }
    
    // Test 2: Try to create a simple profile
    console.log('\n2. Testing profile creation...');
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        email: 'test@example.com',
        app_role: 'user'
      })
      .select();
    
    if (insertError) {
      console.log('❌ Profile creation failed:', insertError.message);
      console.log('Error details:', insertError);
    } else {
      console.log('✅ Profile created successfully:', insertData);
      
      // Clean up test data
      await supabase
        .from('profiles')
        .delete()
        .eq('email', 'test@example.com');
    }
    
    // Test 3: Try signup
    console.log('\n3. Testing signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'admin@funkmybrand.com',
      password: 'admin123'
    });
    
    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
    } else {
      console.log('✅ Signup successful:', signupData.user?.email);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

checkDatabase();