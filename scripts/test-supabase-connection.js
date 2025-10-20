// Simple Node.js script to test Supabase connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', SUPABASE_URL);
  console.log('Key (first 20 chars):', SUPABASE_KEY.substring(0, 20) + '...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // Test 1: Basic connection
    console.log('\n1. Testing basic connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('Error details:', error);
    } else {
      console.log('✅ Connection successful!');
      console.log('Data:', data);
    }
    
    // Test 2: Auth status
    console.log('\n2. Testing auth status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth check failed:', authError.message);
    } else {
      console.log('✅ Auth check successful');
      console.log('Current user:', user ? user.email : 'No user logged in');
    }
    
    // Test 3: Try to sign in
    console.log('\n3. Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@funkmybrand.com',
      password: 'admin123'
    });
    
    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
    } else {
      console.log('✅ Sign in successful!');
      console.log('User:', signInData.user?.email);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testConnection();