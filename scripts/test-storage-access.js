#!/usr/bin/env node

/**
 * Test Storage Access Script
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Storage Access...');
console.log('URL:', supabaseUrl);
console.log('Service Key:', serviceRoleKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testStorageAccess() {
  try {
    // Test 1: List all buckets
    console.log('\n1. Testing bucket listing...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Failed to list buckets:', bucketsError.message);
    } else {
      console.log('✅ Buckets found:', buckets.map(b => b.name));
      
      const uploadsExists = buckets.some(b => b.name === 'uploads');
      console.log('uploads bucket exists:', uploadsExists ? '✅' : '❌');
    }

    // Test 2: Try to list files in uploads bucket
    console.log('\n2. Testing uploads bucket access...');
    const { data: files, error: filesError } = await supabase.storage
      .from('uploads')
      .list();
    
    if (filesError) {
      console.log('❌ Failed to access uploads bucket:', filesError.message);
    } else {
      console.log('✅ Uploads bucket accessible');
      console.log('Files in bucket:', files?.length || 0);
    }

    // Test 3: Try to create a test file
    console.log('\n3. Testing file upload...');
    const testContent = new Blob(['test content'], { type: 'text/plain' });
    const testPath = `test-${Date.now()}.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(testPath, testContent);
    
    if (uploadError) {
      console.log('❌ Failed to upload test file:', uploadError.message);
    } else {
      console.log('✅ Test file uploaded successfully');
      
      // Clean up test file
      await supabase.storage.from('uploads').remove([testPath]);
      console.log('✅ Test file cleaned up');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testStorageAccess();