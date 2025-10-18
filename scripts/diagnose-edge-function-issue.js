#!/usr/bin/env node
/**
 * Diagnose Edge Function Issue
 * Simple test to see what's wrong with the generate-style function
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 Diagnosing Edge Function Issue...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseIssue() {
  try {
    console.log('\n1. Testing simple function call...');
    
    const testCorpus = "I am a creative professional who loves building innovative solutions. I believe in clear communication and getting things done efficiently.";
    
    const response = await supabase.functions.invoke('generate-style', {
      body: { corpus: testCorpus }
    });

    console.log('\n2. Raw response:');
    console.log('Data:', response.data);
    console.log('Error:', response.error);
    
    if (response.error) {
      console.log('\n3. Error analysis:');
      console.log('Message:', response.error.message);
      console.log('Details:', response.error.details);
      console.log('Hint:', response.error.hint);
      console.log('Code:', response.error.code);
      
      // Common issues and solutions
      if (response.error.message?.includes('OPENAI_API_KEY')) {
        console.log('\n🔧 SOLUTION: Set OpenAI API key in Supabase');
        console.log('Run: supabase secrets set OPENAI_API_KEY=your-key-here');
      }
      
      if (response.error.message?.includes('Failed to send a request')) {
        console.log('\n🔧 SOLUTION: Function might not be deployed');
        console.log('Run: supabase functions deploy generate-style');
      }
      
      if (response.error.message?.includes('Payment required')) {
        console.log('\n🔧 SOLUTION: Add credits to OpenAI account');
        console.log('Go to: https://platform.openai.com/settings/organization/billing');
      }
    } else {
      console.log('\n✅ Function working correctly!');
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

diagnoseIssue();