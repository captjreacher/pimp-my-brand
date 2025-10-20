// Test if admin fix worked
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read environment variables from .env file
const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminFix() {
  console.log('🔍 Testing admin fix...\n');
  
  try {
    // Test direct profiles access
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, app_role')
      .limit(5);
    
    if (error) {
      console.log('❌ Still blocked:', error.message);
      console.log('   Run the SQL script in Supabase Dashboard first!');
      return;
    }
    
    console.log('✅ Profiles accessible!');
    console.log(`   Found ${profiles.length} users`);
    
    // Check for admin users
    const adminUsers = profiles.filter(p => 
      ['admin', 'super_admin', 'moderator'].includes(p.app_role)
    );
    
    if (adminUsers.length > 0) {
      console.log('🎉 SUCCESS! Admin users found:');
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.app_role})`);
      });
      console.log('\n✅ Your admin dashboard should now show real data!');
      console.log('   Refresh the page to see the changes.');
    } else {
      console.log('⚠️  No admin users found. Make sure the SQL script ran completely.');
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testAdminFix();