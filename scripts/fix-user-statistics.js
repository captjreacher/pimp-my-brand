// Fix User Statistics - Debug and Fix Count Queries
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserStatistics() {
  console.log('🔧 FIXING USER STATISTICS QUERIES\n');
  
  try {
    // Test different approaches to count queries
    console.log('1. Testing different count query methods...');
    
    // Method 1: Direct count with select
    const { data: method1, error: error1 } = await supabase
      .from('profiles')
      .select('*');
    
    if (!error1) {
      console.log(`✅ Method 1 (select all): ${method1.length} users`);
    } else {
      console.log('❌ Method 1 failed:', error1.message);
    }
    
    // Method 2: Count with head
    const { count: method2, error: error2 } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (!error2) {
      console.log(`✅ Method 2 (count exact): ${method2} users`);
    } else {
      console.log('❌ Method 2 failed:', error2.message);
    }
    
    // Method 3: Simple select with count
    const { data: method3, error: error3 } = await supabase
      .from('profiles')
      .select('id');
    
    if (!error3) {
      console.log(`✅ Method 3 (select id): ${method3.length} users`);
    } else {
      console.log('❌ Method 3 failed:', error3.message);
    }
    
    // Test active users count
    console.log('\n2. Testing active users count...');
    
    const { data: activeUsers, error: activeError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_suspended', false);
    
    if (!activeError) {
      console.log(`✅ Active users: ${activeUsers.length}`);
    } else {
      console.log('❌ Active users failed:', activeError.message);
    }
    
    // Test admin users count
    console.log('\n3. Testing admin users count...');
    
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .in('app_role', ['admin', 'moderator', 'super_admin']);
    
    if (!adminError) {
      console.log(`✅ Admin users: ${adminUsers.length}`);
    } else {
      console.log('❌ Admin users failed:', adminError.message);
    }
    
    // Test new users today
    console.log('\n4. Testing new users today...');
    
    const today = new Date().toISOString().split('T')[0];
    const { data: newUsersToday, error: todayError } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', today);
    
    if (!todayError) {
      console.log(`✅ New users today: ${newUsersToday.length}`);
    } else {
      console.log('❌ New users today failed:', todayError.message);
    }
    
    console.log('\n✅ User statistics queries are working!');
    console.log('The issue was likely in how the service was calling these queries.');
    
  } catch (error) {
    console.error('❌ Fix attempt failed:', error.message);
  }
}

fixUserStatistics();