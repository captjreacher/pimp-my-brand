import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Test the same logic as WorkingAdmin
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const adminSupabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function testWorkingAdminAccess() {
  console.log('🧪 Testing WorkingAdmin access logic...\n');

  try {
    // Simulate the WorkingAdmin loadUsers function
    console.log('1. Checking authentication...');
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session) {
      console.log('❌ No active session - user needs to log in');
      return;
    }
    
    console.log(`✅ User authenticated: ${session.session.user.email}`);

    console.log('\n2. Checking admin status...');
    const { data: currentUser, error: userError } = await supabase
      .from('profiles')
      .select('app_role')
      .eq('id', session.session.user.id)
      .single();

    if (userError) {
      console.log('❌ Error checking user role:', userError.message);
      return;
    }

    console.log(`✅ User role: ${currentUser?.app_role || 'user'}`);

    if (!currentUser?.app_role || !['admin', 'super_admin', 'moderator'].includes(currentUser.app_role)) {
      console.log('❌ User does not have admin privileges');
      return;
    }

    console.log('\n3. Fetching all users with admin client...');
    const { data, error } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name, app_role, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.log('❌ Error fetching users:', error.message);
      return;
    }

    console.log(`✅ Successfully fetched ${data.length} users:`);
    data.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - Role: ${user.app_role || 'user'} (ID: ${user.id.substring(0, 8)}...)`);
    });

    console.log('\n🎉 WorkingAdmin should now display all users!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWorkingAdminAccess();