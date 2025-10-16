// Simple Supabase connection test
// Run this with: node scripts/test-connection.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cwodhdvryibqoljaybzj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3b2RoZHZyeWlicW9samF5YnpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzMwNTQsImV4cCI6MjA3NDc0OTA1NH0.PEzZVjKeBzZD0-uhjHN-F8Sox9i4jDlj_NtvcUrUztQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('Connection error:', error.message);
      
      // Check if profiles table exists
      if (error.message.includes('relation "profiles" does not exist')) {
        console.log('\n❌ The profiles table does not exist.');
        console.log('You need to run the database setup first.');
        console.log('\nNext steps:');
        console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the minimal-admin-setup.sql script');
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();