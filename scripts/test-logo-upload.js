#!/usr/bin/env node
/**
 * Test Logo Upload Script
 * Tests logo upload with user session (like the app does)
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 Testing Logo Upload...');
console.log('URL:', supabaseUrl);
console.log('Publishable Key:', supabaseKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogoUpload() {
  try {
    // Test 1: Check current user
    console.log('\n1. Checking current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ No authenticated user found');
      console.log('You need to be logged in for this test');
      return;
    }
    console.log('✅ User authenticated:', user.email);
    console.log('User ID:', user.id);

    // Test 2: List buckets (this should work)
    console.log('\n2. Testing bucket listing...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.log('❌ Failed to list buckets:', bucketsError.message);
    } else {
      console.log('✅ Buckets found:', buckets.map(b => b.name));
    }

    // Test 3: Try to access logos bucket
    console.log('\n3. Testing logos bucket access...');
    const { data: files, error: filesError } = await supabase.storage
      .from('logos')
      .list();

    if (filesError) {
      console.log('❌ Failed to access logos bucket:', filesError.message);
      console.log('Error details:', filesError);
    } else {
      console.log('✅ Logos bucket accessible');
      console.log('Files in bucket:', files?.length || 0);
    }

    // Test 4: Try to upload a test logo
    console.log('\n4. Testing logo upload...');
    const testContent = new Blob(['<svg width="100" height="100"><rect width="100" height="100" fill="blue"/></svg>'], { type: 'image/svg+xml' });
    const testPath = `${user.id}/test-logo-${Date.now()}.svg`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(testPath, testContent);

    if (uploadError) {
      console.log('❌ Failed to upload test logo:', uploadError.message);
      console.log('Error details:', uploadError);
    } else {
      console.log('✅ Test logo uploaded successfully');
      
      // Test getting public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(testPath);
      
      console.log('✅ Public URL generated:', publicUrl);

      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('logos')
        .remove([testPath]);

      if (deleteError) {
        console.log('⚠️  Failed to clean up test logo:', deleteError.message);
      } else {
        console.log('✅ Test logo cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testLogoUpload();