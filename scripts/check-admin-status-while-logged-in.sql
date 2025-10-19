-- Check admin status while logged in
-- This should now return data since you're authenticated

SELECT 
  'Current User Info' as check_type,
  auth.uid() as user_id,
  auth.email() as user_email;

SELECT 
  'Profile Check' as check_type,
  id,
  email,
  app_role,
  created_at
FROM profiles 
WHERE id = auth.uid();

SELECT 
  'Admin Status' as check_type,
  CASE 
    WHEN app_role = 'admin' THEN 'YES - You are an admin!'
    WHEN app_role = 'user' THEN 'NO - You are a regular user'
    WHEN app_role IS NULL THEN 'NO - No role assigned'
    ELSE 'UNKNOWN - Role: ' || app_role
  END as admin_status,
  app_role as current_role
FROM profiles 
WHERE id = auth.uid();