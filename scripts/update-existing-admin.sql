-- Simple update script to fix existing admin user
-- This avoids the duplicate key constraint by updating instead of inserting

-- Show current state
SELECT 'BEFORE UPDATE:' as status;
SELECT u.id, u.email, u.raw_user_meta_data->>'full_name' as display_name, p.app_role 
FROM auth.users u 
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email IN ('admin@funkmybrand.com', 'admin@maximisedai.com');

-- Update the auth.users table
UPDATE auth.users 
SET 
    email = 'admin@maximisedai.com',
    encrypted_password = crypt('Temp123!', gen_salt('bf')),
    raw_user_meta_data = '{"full_name": "admin"}'::jsonb,
    updated_at = now()
WHERE email = 'admin@funkmybrand.com';

-- Update or insert the profile (using UPSERT to handle both cases)
INSERT INTO profiles (id, email, app_role, created_at, updated_at)
SELECT u.id, 'admin@maximisedai.com', 'super_admin', now(), now()
FROM auth.users u 
WHERE u.email = 'admin@maximisedai.com'
ON CONFLICT (id) 
DO UPDATE SET 
    email = 'admin@maximisedai.com',
    app_role = 'super_admin',
    updated_at = now();

-- Show final state
SELECT 'AFTER UPDATE:' as status;
SELECT u.id, u.email, u.raw_user_meta_data->>'full_name' as display_name, p.app_role 
FROM auth.users u 
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@maximisedai.com';

SELECT 'SUCCESS: Admin user updated. You can now sign in with admin@maximisedai.com / Temp123!' as result;