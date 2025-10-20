#!/usr/bin/env node
/**
 * Test Image Loading
 * Tests if the template images are loading properly
 */

const testImages = [
  "https://images.unsplash.com/photo-1559114367-ff25e89adb7d?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1549451371-64aa98a6f660?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=640&q=80"
];

console.log('🔍 Testing Image Loading...');

async function testImageLoading() {
  for (const imageUrl of testImages) {
    try {
      console.log(`\nTesting: ${imageUrl}`);
      
      const response = await fetch(imageUrl, { method: 'HEAD' });
      
      if (response.ok) {
        console.log(`✅ Image accessible (${response.status})`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')}`);
      } else {
        console.log(`❌ Image failed (${response.status}): ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
  }
  
  console.log('\n🔍 Testing CORS...');
  try {
    const testUrl = testImages[0];
    const response = await fetch(testUrl);
    const blob = await response.blob();
    console.log(`✅ CORS working - Downloaded ${blob.size} bytes`);
  } catch (error) {
    console.log(`❌ CORS issue: ${error.message}`);
  }
}

testImageLoading();