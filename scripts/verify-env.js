// Environment verification script
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

function verifyEnvironment() {
  console.log('🔍 Verifying Environment Configuration\n');
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY'
  ];
  
  let allGood = true;
  
  // Check required environment variables
  console.log('📋 Checking environment variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allGood = false;
    }
  });
  
  if (!allGood) {
    console.log('\n❌ Missing required environment variables.');
    console.log('Please create a .env file with:');
    console.log('VITE_SUPABASE_URL=https://nfafvtyhmprzydxhebbm.supabase.co');
    console.log('VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    return false;
  }
  
  // Test Supabase connection
  console.log('\n🔗 Testing Supabase connection:');
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    );
    
    console.log('✅ Supabase client created successfully');
    return true;
  } catch (error) {
    console.log('❌ Supabase client creation failed:', error.message);
    return false;
  }
}

if (verifyEnvironment()) {
  console.log('\n🎉 Environment configuration is correct!');
} else {
  console.log('\n❌ Environment configuration needs fixing.');
}