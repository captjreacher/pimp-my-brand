#!/usr/bin/env node
/**
 * Test Brand Generation Chain
 * Tests all functions in the brand generation workflow
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 Testing Brand Generation Chain...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBrandGenerationChain() {
  try {
    // Test data
    const testCorpus = "I am a creative professional who loves building innovative solutions. I believe in clear communication and getting things done efficiently. My work focuses on user experience and practical design. I enjoy collaborating with teams and solving complex problems with simple, elegant solutions.";
    
    console.log('\n1. Testing generate-style...');
    const { data: styleData, error: styleError } = await supabase.functions.invoke('generate-style', {
      body: { corpus: testCorpus }
    });

    if (styleError) {
      console.log('❌ generate-style failed:', styleError.message);
      return;
    }
    console.log('✅ generate-style working');
    console.log('Style data keys:', Object.keys(styleData || {}));

    console.log('\n2. Testing generate-visual...');
    const { data: visualData, error: visualError } = await supabase.functions.invoke('generate-visual', {
      body: { 
        keywords: styleData?.tone?.adjectives || ['creative', 'professional'],
        roleTags: ['designer'],
        bio: styleData?.bio || 'A creative professional'
      }
    });

    if (visualError) {
      console.log('❌ generate-visual failed:', visualError.message);
      console.log('Error details:', visualError);
      return;
    }
    console.log('✅ generate-visual working');
    console.log('Visual data keys:', Object.keys(visualData || {}));

    console.log('\n3. Testing generate-brand...');
    const { data: riderData, error: riderError } = await supabase.functions.invoke('generate-brand', {
      body: { 
        styleData, 
        visualData, 
        format: 'custom' 
      }
    });

    if (riderError) {
      console.log('❌ generate-brand failed:', riderError.message);
      console.log('Error details:', riderError);
      return;
    }
    console.log('✅ generate-brand working');
    console.log('Rider data keys:', Object.keys(riderData || {}));

    console.log('\n🎉 All functions in the brand generation chain are working!');
    console.log('\n📊 Summary:');
    console.log('- Style analysis: ✅');
    console.log('- Visual identity: ✅');
    console.log('- Brand rider: ✅');
    
    console.log('\n🔍 The issue might be:');
    console.log('1. Authentication in the app (user not logged in)');
    console.log('2. Database permissions for saving the brand');
    console.log('3. A timing issue in the UI');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testBrandGenerationChain();