#!/usr/bin/env node
/**
 * Check Storage Setup Script
 * Verifies if the uploads bucket exists and creates it if needed
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Storage Setup...');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorageSetup() {
  try {
    // Check if uploads bucket exists
    console.log('\n1. Checking if uploads bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Failed to list buckets:', bucketsError.message);
      return;
    }
    
    console.log('✅ Available buckets:', buckets.map(b => b.name));
    
    const uploadsBucket = buckets.find(b => b.name === 'uploads');
    
    if (!uploadsBucket) {
      console.log('\n2. Creating uploads bucket...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('uploads', {
        public: false,
        allowedMimeTypes: [
          'text/plain',
          'text/markdown',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'image/png',
          'image/jpeg',
          'image/jpg'
        ],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.log('❌ Failed to create uploads bucket:', createError.message);
        return;
      }
      
      console.log('✅ Uploads bucket created successfully');
    } else {
      console.log('✅ Uploads bucket already exists');
    }
    
    // Test bucket access
    console.log('\n3. Testing bucket access...');
    const { data: files, error: listError } = await supabase.storage
      .from('uploads')
      .list('', { limit: 1 });
    
    if (listError) {
      console.log('❌ Failed to access uploads bucket:', listError.message);
      console.log('Error details:', listError);
    } else {
      console.log('✅ Uploads bucket is accessible');
    }
    
    // Test upload with service role
    console.log('\n4. Testing file upload with service role...');
    const testContent = new Blob(['test content from service role'], { type: 'text/plain' });
    const testPath = `test-service-${Date.now()}.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(testPath, testContent);
    
    if (uploadError) {
      console.log('❌ Failed to upload test file:', uploadError.message);
      console.log('Error details:', uploadError);
    } else {
      console.log('✅ Test file uploaded successfully');
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('uploads')
        .remove([testPath]);
      
      if (deleteError) {
        console.log('⚠️  Failed to clean up test file:', deleteError.message);
      } else {
        console.log('✅ Test file cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkStorageSetup();