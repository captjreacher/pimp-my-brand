// Test what the browser is actually seeing
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBrowserAdminData() {
  console.log('🔍 TESTING WHAT BROWSER SEES - ADMIN DATA\n');
  
  try {
    // Test exactly what the admin dashboard would see
    console.log('1. Testing User Management Service calls...');
    
    // Direct profiles query (what the service should use)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, app_role, subscription_tier, created_at, updated_at, is_suspended')
      .limit(10);
    
    if (usersError) {
      console.log('❌ Users query failed:', usersError.message);
      console.log('   This means the browser will see demo data!');
    } else {
      console.log(`✅ Users query works: ${users.length} real users`);
      console.log('   Sample user data the browser sees:');
      users.slice(0, 2).forEach(user => {
        console.log(`   - ${user.email} (${user.app_role || 'user'}) - ${user.subscription_tier || 'free'}`);
      });
    }
    
    // Test user statistics (what analytics would use)
    console.log('\n2. Testing Analytics Service calls...');
    
    const { data: totalUsers } = await supabase.from('profiles').select('id');
    const { data: activeUsers } = await supabase.from('profiles').select('id').eq('is_suspended', false);
    
    if (totalUsers && activeUsers) {
      console.log(`✅ Analytics queries work: ${totalUsers.length} total, ${activeUsers.length} active`);
    } else {
      console.log('❌ Analytics queries failed - browser will see mock data!');
    }
    
    // Test content for moderation
    console.log('\n3. Testing Moderation Service calls...');
    
    const { data: brands } = await supabase.from('brands').select('id, title, bio, user_id');
    const { data: cvs } = await supabase.from('cvs').select('id, title, user_id');
    
    if (brands && cvs) {
      console.log(`✅ Content queries work: ${brands.length} brands, ${cvs.length} CVs`);
      console.log('   Sample content for moderation:');
      brands.slice(0, 2).forEach(brand => {
        console.log(`   - "${brand.title}" (ID: ${brand.id.substring(0, 8)}...)`);
      });
    } else {
      console.log('❌ Content queries failed - browser will see mock data!');
    }
    
    // Test what the demo data banner check would see
    console.log('\n4. Testing Demo Data Banner Logic...');
    
    // This is what the DemoDataBanner component checks
    const demoUsers = users?.filter(u => 
      u.email.includes('demo') || 
      u.email.includes('mock') || 
      u.email.includes('fake')
    ) || [];
    
    const realUsers = users?.filter(u => 
      !u.email.includes('demo') && 
      !u.email.includes('mock') && 
      !u.email.includes('fake')
    ) || [];
    
    console.log(`   Demo/mock users: ${demoUsers.length}`);
    console.log(`   Real users: ${realUsers.length}`);
    
    if (realUsers.length > 0) {
      console.log('✅ Browser should NOT show demo data banner');
    } else {
      console.log('❌ Browser WILL show demo data banner');
    }
    
    console.log('\n📋 BROWSER STATUS SUMMARY:');
    console.log('==========================');
    
    if (users && users.length > 0 && realUsers.length > 0) {
      console.log('🎉 BROWSER SHOULD SHOW REAL DATA!');
      console.log('   ✅ Database queries working');
      console.log('   ✅ Real users found');
      console.log('   ✅ No demo data detected');
      console.log('\n🔄 If you still see mock data in browser:');
      console.log('   1. Restart your dev server (npm run dev)');
      console.log('   2. Hard refresh the browser (Ctrl+F5)');
      console.log('   3. Clear browser cache');
    } else {
      console.log('❌ BROWSER WILL SHOW MOCK DATA');
      console.log('   Database queries are failing');
      console.log('   Admin services will use fallback demo data');
    }
    
  } catch (error) {
    console.error('❌ Browser test failed:', error.message);
    console.log('   This means the browser will definitely see mock data!');
  }
}

testBrowserAdminData();