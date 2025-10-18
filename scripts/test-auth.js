#!/usr/bin/env node

/**
 * Simple Auth Test Script
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔐 Testing Supabase Authentication...');
console.log('URL:', supabaseUrl);
console.log('Key (first 20 chars):', supabaseKey?.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  try {
    // Test 1: Try to sign up a test user
    console.log('\n1. Testing sign up...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@funkmybrand.com',
      password: 'testpassword123',
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });

    if (signUpError) {
      console.log('❌ Sign up failed:', signUpError.message);
      console.log('Error details:', signUpError);
    } else {
      console.log('✅ Sign up successful!');
      console.log('User ID:', signUpData.user?.id);
      console.log('Email confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No');
    }

    // Test 2: Check if profiles table exists and is accessible
    console.log('\n2. Testing profiles table...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profileError) {
      console.log('❌ Profiles table error:', profileError.message);
    } else {
      console.log('✅ Profiles table accessible');
      console.log('Profile count:', profileData?.length || 0);
    }

    // Test 3: Check auth configuration
    console.log('\n3. Testing auth configuration...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else {
      console.log('✅ Auth configuration working');
      console.log('Current session:', session ? 'Active' : 'None');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testAuth();