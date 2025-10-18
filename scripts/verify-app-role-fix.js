// Script to verify that the app_role fix worked
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function verifyFix() {
  console.log('Verifying app_role fix...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // Test 1: Try to select app_role column
    console.log('\n1. Testing app_role column access...');
    const { data: roleData, error: roleError } = await supabase
      .from('profiles')
      .select('id, email, app_role, admin_permissions')
      .limit(5);
    
    if (roleError) {
      console.log('❌ app_role column still missing:', roleError.message);
      return false;
    } else {
      console.log('✅ app_role column exists!');
      console.log('Sample data:');
      console.table(roleData);
    }
    
    // Test 2: Check for admin users
    console.log('\n2. Checking for admin users...');
    const { data: adminData, error: adminError } = await supabase
      .from('profiles')
      .select('email, app_role, admin_permissions')
      .in('app_role', ['admin', 'super_admin', 'moderator']);
    
    if (adminError) {
      console.log('❌ Error checking admin users:', adminError.message);
    } else {
      console.log('✅ Admin users found:');
      console.table(adminData);
      
      if (adminData.length === 0) {
        console.log('⚠️  No admin users found. You may need to create one.');
      }
    }
    
    // Test 3: Try to insert a test profile with app_role
    console.log('\n3. Testing app_role insertion...');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        email: testEmail,
        app_role: 'user',
        admin_permissions: []
      })
      .select();
    
    if (insertError) {
      console.log('❌ Error inserting with app_role:', insertError.message);
    } else {
      console.log('✅ Successfully inserted profile with app_role!');
      console.log('Test profile:', insertData[0]);
      
      // Clean up test profile
      await supabase.from('profiles').delete().eq('email', testEmail);
      console.log('✅ Test profile cleaned up');
    }
    
    console.log('\n🎉 app_role fix verification complete!');
    return true;
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
    return false;
  }
}

verifyFix();