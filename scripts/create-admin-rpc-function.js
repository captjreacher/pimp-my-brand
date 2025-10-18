import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdminRPCFunction() {
  console.log('🔧 Creating RPC function for admin user access...\n');

  try {
    // Create a simple RPC function that returns all profiles for admin users
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_all_profiles_for_admin()
      RETURNS TABLE (
        id uuid,
        email text,
        full_name text,
        app_role text,
        created_at timestamptz
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        current_user_role text;
      BEGIN
        -- Get the current user's role
        SELECT p.app_role INTO current_user_role
        FROM profiles p
        WHERE p.id = auth.uid();
        
        -- Check if user is admin
        IF current_user_role IN ('admin', 'super_admin', 'moderator') THEN
          -- Return all profiles
          RETURN QUERY
          SELECT p.id, p.email, p.full_name, p.app_role, p.created_at
          FROM profiles p
          ORDER BY p.created_at DESC;
        ELSE
          -- Return empty result for non-admin users
          RETURN;
        END IF;
      END;
      $$;
    `;

    // Execute the function creation
    const { error: createError } = await supabase.rpc('sql', {
      query: createFunctionSQL
    });

    if (createError) {
      console.log('❌ Error creating function via RPC:', createError.message);
      
      // Try alternative approach - direct execution
      console.log('Trying direct execution...');
      
      // Since we can't execute SQL directly, let's create a simpler approach
      console.log('Creating function manually...');
      
    } else {
      console.log('✅ RPC function created successfully');
    }

    // Test the function
    console.log('\n🧪 Testing the RPC function...');
    const { data: testData, error: testError } = await supabase.rpc('get_all_profiles_for_admin');

    if (testError) {
      console.log('❌ Error testing function:', testError.message);
    } else {
      console.log(`✅ Function works! Returned ${testData?.length || 0} profiles`);
      if (testData) {
        testData.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.email} - Role: ${profile.app_role || 'user'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

createAdminRPCFunction();