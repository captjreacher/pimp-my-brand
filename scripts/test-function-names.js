#!/usr/bin/env node
/**
 * Test Function Names
 * Tests different function name variations to find the correct one
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 Testing Function Names...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFunctionNames() {
  const testData = {
    styleData: { tagline: 'Test', bio: 'Test bio' },
    visualData: { palette: [], fonts: {} },
    format: 'custom'
  };

  const functionNames = [
    'generate-brand-rider',
    'generate-brand',
    'generateBrandRider',
    'brand-rider',
    'generate_brand_rider'
  ];

  for (const funcName of functionNames) {
    console.log(`\nTesting function name: ${funcName}`);
    try {
      const { data, error } = await supabase.functions.invoke(funcName, {
        body: testData
      });

      if (error) {
        console.log(`❌ ${funcName}: ${error.message}`);
      } else {
        console.log(`✅ ${funcName}: Working!`);
        console.log('Response keys:', Object.keys(data || {}));
        break; // Found the working one
      }
    } catch (error) {
      console.log(`❌ ${funcName}: ${error.message}`);
    }
  }
}

testFunctionNames();