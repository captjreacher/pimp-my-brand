const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function fixRPCFunctions() {
  try {
    console.log('Testing current RPC function...');
    const { data: testData, error: testError } = await supabase.rpc('get_admin_user_list', {
      p_search: null,
      p_role_filter: null,
      p_status_filter: 'all',
      p_limit: 5,
      p_offset: 0
    });
    
    if (testError) {
      console.error('RPC function has error:', testError.message);
      console.log('\nThe function needs to be fixed in the Supabase dashboard SQL editor.');
      console.log('Please run the following SQL in your Supabase SQL editor:\n');
      
      console.log('-- Drop existing function');
      console.log('DROP FUNCTION IF EXISTS get_admin_user_list;\n');
      
      console.log('-- Create fixed function');
      console.log(`CREATE OR REPLACE FUNCTION get_admin_user_list(
  p_search TEXT DEFAULT NULL,
  p_role_filter TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  app_role TEXT,
  subscription_tier TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in TIMESTAMPTZ,
  is_suspended BOOLEAN,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID,
  suspension_reason TEXT,
  admin_notes TEXT,
  last_admin_action TEXT,
  content_count BIGINT,
  total_generations BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.app_role,
    p.subscription_tier,
    p.created_at,
    p.updated_at as last_sign_in,
    p.is_suspended,
    p.suspended_at,
    p.suspended_by,
    p.suspension_reason,
    p.admin_notes,
    p.last_admin_action,
    COALESCE(brand_count.count, 0) + COALESCE(cv_count.count, 0) as content_count,
    0::BIGINT as total_generations
  FROM profiles p
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM brands 
    GROUP BY user_id
  ) brand_count ON p.id = brand_count.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM cvs 
    GROUP BY user_id
  ) cv_count ON p.id = cv_count.user_id
  WHERE 
    (p_search IS NULL OR 
     p.full_name ILIKE '%' || p_search || '%' OR 
     p.email ILIKE '%' || p_search || '%')
    AND (p_role_filter IS NULL OR p.app_role = p_role_filter)
    AND (p_status_filter = 'all' OR 
         (p_status_filter = 'active' AND p.is_suspended = false) OR
         (p_status_filter = 'suspended' AND p.is_suspended = true))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;`);
      
      console.log('\n-- Grant permissions');
      console.log('GRANT EXECUTE ON FUNCTION get_admin_user_list TO authenticated;');
      
    } else {
      console.log('RPC function is working correctly!');
      console.log('Test data:', testData);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixRPCFunctions();