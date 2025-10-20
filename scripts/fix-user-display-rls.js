import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUserDisplayRLS() {
  console.log('🔧 Fixing RLS policies for user display...\n');

  try {
    // Check current policies
    console.log('1. Checking current policies...');
    const { data: currentPolicies, error: policyError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
              FROM pg_policies 
              WHERE tablename = 'profiles'` 
      });

    if (policyError) {
      console.log('❌ Error checking policies:', policyError.message);
    } else {
      console.log(`✅ Found ${currentPolicies?.length || 0} current policies`);
    }

    // Drop existing restrictive policies
    console.log('\n2. Dropping existing restrictive policies...');
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view own profile" ON profiles',
      'DROP POLICY IF EXISTS "Users can update own profile" ON profiles', 
      'DROP POLICY IF EXISTS "Enable read access for all users" ON profiles',
      'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles',
      'DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles'
    ];

    for (const sql of dropPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.log(`⚠️  Warning dropping policy: ${error.message}`);
      } else {
        console.log(`✅ Dropped policy: ${sql.split('"')[1] || 'policy'}`);
      }
    }

    // Create new policies
    console.log('\n3. Creating new admin-friendly policies...');
    const newPolicies = [
      {
        name: 'Users can view own profile',
        sql: `CREATE POLICY "Users can view own profile" ON profiles
              FOR SELECT USING (auth.uid() = id)`
      },
      {
        name: 'Admins can view all profiles', 
        sql: `CREATE POLICY "Admins can view all profiles" ON profiles
              FOR SELECT USING (
                  EXISTS (
                      SELECT 1 FROM profiles 
                      WHERE id = auth.uid() 
                      AND app_role IN ('admin', 'super_admin', 'moderator')
                  )
              )`
      },
      {
        name: 'Users can insert own profile',
        sql: `CREATE POLICY "Users can insert own profile" ON profiles
              FOR INSERT WITH CHECK (auth.uid() = id)`
      },
      {
        name: 'Users can update own profile',
        sql: `CREATE POLICY "Users can update own profile" ON profiles
              FOR UPDATE USING (auth.uid() = id)`
      },
      {
        name: 'Admins can update any profile',
        sql: `CREATE POLICY "Admins can update any profile" ON profiles
              FOR UPDATE USING (
                  EXISTS (
                      SELECT 1 FROM profiles 
                      WHERE id = auth.uid() 
                      AND app_role IN ('admin', 'super_admin')
                  )
              )`
      }
    ];

    for (const policy of newPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
      if (error) {
        console.log(`❌ Error creating ${policy.name}: ${error.message}`);
      } else {
        console.log(`✅ Created policy: ${policy.name}`);
      }
    }

    // Verify new policies
    console.log('\n4. Verifying new policies...');
    const { data: newPolicies2, error: verifyError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd
              FROM pg_policies 
              WHERE tablename = 'profiles'
              ORDER BY policyname` 
      });

    if (verifyError) {
      console.log('❌ Error verifying policies:', verifyError.message);
    } else {
      console.log(`✅ Verified ${newPolicies2?.length || 0} policies are now active`);
      if (newPolicies2) {
        newPolicies2.forEach((policy, index) => {
          console.log(`   ${index + 1}. ${policy.policyname} (${policy.cmd})`);
        });
      }
    }

    console.log('\n🎉 RLS policies updated! Admin users should now be able to see all profiles.');

  } catch (error) {
    console.error('❌ Failed to fix RLS policies:', error.message);
  }
}

fixUserDisplayRLS();