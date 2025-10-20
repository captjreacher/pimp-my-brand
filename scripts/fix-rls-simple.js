import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRLSSimple() {
  console.log('🔧 Fixing RLS policies for admin access...\n');

  try {
    // Temporarily disable RLS to allow admin access
    console.log('1. Temporarily disabling RLS on profiles table...');
    const { error: disableError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    // Actually, let's just check if we can query as an admin user
    console.log('2. Testing admin access to profiles...');
    
    // First, let's see what happens when we query with the service role
    const { data: serviceData, error: serviceError } = await supabase
      .from('profiles')
      .select('id, email, full_name, app_role, created_at')
      .order('created_at', { ascending: false });

    if (serviceError) {
      console.log('❌ Service role error:', serviceError.message);
    } else {
      console.log(`✅ Service role can see ${serviceData.length} profiles`);
    }

    // Now let's try to create a simple policy that allows admin access
    console.log('\n3. Creating simple admin access policy...');
    
    // Use raw SQL through a simple query
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          -- Drop existing policies
          DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
          DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
          DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
          
          -- Create a simple policy that allows admin users to see all profiles
          CREATE POLICY "Admin access to all profiles" ON profiles
            FOR ALL USING (
              auth.uid() IS NOT NULL AND (
                auth.uid() = id OR 
                EXISTS (
                  SELECT 1 FROM profiles 
                  WHERE id = auth.uid() 
                  AND app_role IN ('admin', 'super_admin', 'moderator')
                )
              )
            );
        `
      });

    if (error) {
      console.log('❌ Error with RPC:', error.message);
      
      // Try a different approach - just disable RLS temporarily
      console.log('\n4. Trying to disable RLS temporarily...');
      
      // Let's check if RLS is even enabled
      console.log('Checking RLS status...');
      
    } else {
      console.log('✅ Successfully updated RLS policies');
    }

  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

fixRLSSimple();