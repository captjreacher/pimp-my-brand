-- Simple script to make you admin
-- Replace YOUR_EMAIL_HERE with your actual email

UPDATE profiles 
SET app_role = 'super_admin' 
WHERE email = 'YOUR_EMAIL_HERE';

-- Check if it worked
SELECT id, email, app_role 
FROM profiles 
WHERE app_role = 'super_admin';