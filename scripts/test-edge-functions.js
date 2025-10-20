#!/usr/bin/env node
/**
 * Test Edge Functions Script
 * Tests if the Supabase Edge Functions are working
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 Testing Edge Functions...');
console.log('URL:', supabaseUrl);
console.log('Publishable Key:', supabaseKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdgeFunctions() {
  try {
    // Test 1: Check authentication
    console.log('\n1. Checking authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ No authenticated user found');
      console.log('You need to be logged in for this test');
      return;
    }
    console.log('✅ User authenticated:', user.email);

    // Test 2: Test generate-style function
    console.log('\n2. Testing generate-style function...');
    const testCorpus = "I am a creative professional who loves building innovative solutions. I believe in clear communication and getting things done efficiently. My work focuses on user experience and practical design. I enjoy collaborating with teams and solving complex problems with simple, elegant solutions.";
    
    try {
      const { data: styleData, error: styleError } = await supabase.functions.invoke('generate-style', {
        body: { corpus: testCorpus }
      });

      if (styleError) {
        console.log('❌ generate-style failed:', styleError.message);
        console.log('Error details:', styleError);
      } else {
        console.log('✅ generate-style working');
        console.log('Response keys:', Object.keys(styleData || {}));
      }
    } catch (error) {
      console.log('❌ generate-style error:', error.message);
    }

    // Test 3: Test generate-visual function
    console.log('\n3. Testing generate-visual function...');
    try {
      const { data: visualData, error: visualError } = await supabase.functions.invoke('generate-visual', {
        body: { 
          keywords: ['creative', 'professional', 'innovative'],
          roleTags: ['designer'],
          bio: 'A creative professional focused on user experience'
        }
      });

      if (visualError) {
        console.log('❌ generate-visual failed:', visualError.message);
        console.log('Error details:', visualError);
      } else {
        console.log('✅ generate-visual working');
        console.log('Response keys:', Object.keys(visualData || {}));
      }
    } catch (error) {
      console.log('❌ generate-visual error:', error.message);
    }

    // Test 4: Test generate-logo function
    console.log('\n4. Testing generate-logo function...');
    try {
      const { data: logoData, error: logoError } = await supabase.functions.invoke('generate-logo', {
        body: { 
          prompt: 'minimalist tech logo',
          brandName: 'Test Brand',
          colorPalette: ['#3B82F6', '#1E40AF']
        }
      });

      if (logoError) {
        console.log('❌ generate-logo failed:', logoError.message);
        console.log('Error details:', logoError);
      } else {
        console.log('✅ generate-logo working');
        console.log('Response keys:', Object.keys(logoData || {}));
      }
    } catch (error) {
      console.log('❌ generate-logo error:', error.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testEdgeFunctions();