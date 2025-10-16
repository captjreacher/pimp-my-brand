-- Make Me Admin - Run this after you get your user ID from the previous script

-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from the previous query
-- Example: UPDATE profiles SET app_role = 'super_admin' WHERE id = 'bdc1eedc-87e5-43ae-9304-16e673986696';

UPDATE profiles SET app_role = 'super_admin' WHERE id = 'YOUR_USER_ID_HERE';

-- Verify it worked
SELECT u.email, p.app_role, p.id 
FROM auth.users u 
JOIN profiles p ON u.id = p.id 
WHERE p.app_role = 'super_admin';