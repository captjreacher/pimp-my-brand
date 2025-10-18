import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function temporarilyDisableRLS() {
  console.log('🔧 Temporarily disabling RLS on profiles table...\n');

  try {
    // Disable RLS on profiles table
    const { error: disableError } = await supabase.rpc('sql', {
      query: 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError) {
      console.log('❌ Error disabling RLS:', disableError.message);
      
      // Try alternative approach using direct SQL
      console.log('Trying alternative approach...');
      
      // Check current RLS status
      const { data: rlsStatus, error: statusError } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', 'profiles')
        .eq('schemaname', 'public');

      if (statusError) {
        console.log('❌ Error checking RLS status:', statusError.message);
      } else {
        console.log('✅ Current RLS status:', rlsStatus);
      }

    } else {
      console.log('✅ RLS disabled on profiles table');
    }

    // Test if we can now see all users
    console.log('\n🧪 Testing user access after RLS change...');
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, app_role, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
    } else {
      console.log(`✅ Can now see ${allUsers.length} users:`);
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - Role: ${user.app_role || 'user'}`);
      });
    }

    console.log('\n⚠️  Remember to re-enable RLS after testing!');
    console.log('   Run: ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;');

  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

temporarilyDisableRLS();