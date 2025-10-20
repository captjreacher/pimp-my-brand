#!/usr/bin/env node
/**
 * Fix Logos Bucket Script
 * Creates the logos bucket and sets up proper policies
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Fixing Logos Bucket...');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixLogosBucket() {
  try {
    // Check if logos bucket exists
    console.log('\n1. Checking if logos bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Failed to list buckets:', bucketsError.message);
      return;
    }
    
    console.log('✅ Available buckets:', buckets.map(b => b.name));
    
    const logosBucket = buckets.find(b => b.name === 'logos');
    
    if (!logosBucket) {
      console.log('\n2. Creating logos bucket...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('logos', {
        public: true, // Logos can be public for display
        allowedMimeTypes: [
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/svg+xml',
          'image/webp'
        ],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.log('❌ Failed to create logos bucket:', createError.message);
        return;
      }
      
      console.log('✅ Logos bucket created successfully');
    } else {
      console.log('✅ Logos bucket already exists');
    }
    
    // Test bucket access
    console.log('\n3. Testing logos bucket access...');
    const { data: files, error: listError } = await supabase.storage
      .from('logos')
      .list('', { limit: 1 });
    
    if (listError) {
      console.log('❌ Failed to access logos bucket:', listError.message);
      console.log('Error details:', listError);
    } else {
      console.log('✅ Logos bucket is accessible');
    }
    
    // Test upload with service role
    console.log('\n4. Testing logo upload with service role...');
    const testContent = new Blob(['<svg><rect width="100" height="100" fill="red"/></svg>'], { type: 'image/svg+xml' });
    const testPath = `test-service-${Date.now()}.svg`;
    
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(testPath, testContent);
    
    if (uploadError) {
      console.log('❌ Failed to upload test logo:', uploadError.message);
      console.log('Error details:', uploadError);
    } else {
      console.log('✅ Test logo uploaded successfully');
      
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

fixLogosBucket();