#!/usr/bin/env node
/**
 * Fix Template Images
 * Tests all template image URLs and provides working replacements
 */

const testImages = [
  "https://images.unsplash.com/photo-1559114367-ff25e89adb7d?auto=format&fit=crop&w=640&q=80", // UFC - BROKEN
  "https://images.unsplash.com/photo-1549451371-64aa98a6f660?auto=format&fit=crop&w=640&q=80", // UFC - WORKING
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=640&q=80", // Fallback - WORKING
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=640&q=80", // Executive - WORKING
  "https://images.unsplash.com/photo-1546525848-3ce03ca516f6?auto=format&fit=crop&w=640&q=80", // Team
  "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=640&q=80", // NFL
  "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=640&q=80", // Influencer
];

console.log('🔍 Testing All Template Images...');

async function testAllImages() {
  const workingImages = [];
  const brokenImages = [];
  
  for (const imageUrl of testImages) {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      
      if (response.ok) {
        console.log(`✅ ${imageUrl.substring(0, 80)}...`);
        workingImages.push(imageUrl);
      } else {
        console.log(`❌ ${imageUrl.substring(0, 80)}... (${response.status})`);
        brokenImages.push(imageUrl);
      }
    } catch (error) {
      console.log(`❌ ${imageUrl.substring(0, 80)}... (Network error)`);
      brokenImages.push(imageUrl);
    }
  }
  
  console.log(`\n📊 Results:`);
  console.log(`✅ Working: ${workingImages.length}`);
  console.log(`❌ Broken: ${brokenImages.length}`);
  
  if (brokenImages.length > 0) {
    console.log(`\n🔧 Broken URLs to replace:`);
    brokenImages.forEach(url => console.log(`   ${url}`));
  }
}

testAllImages();