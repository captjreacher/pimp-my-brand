-- Final simple fix - just update the existing user with email confirmation
-- This avoids all the deletion/recreation issues

-- Show current state
SELECT 'CURRENT STATE:' as status;
SELECT 
    u.id, 
    u.email, 
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    u.raw_user_meta_data->>'full_name' as display_name,
    p.app_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@maximisedai.com';

-- Simply update the existing user with confirmed email and new password
UPDATE auth.users 
SET 
    encrypted_password = crypt('Temp123!', gen_salt('bf')),
    email_confirmed_at = now(), -- Force email confirmation
    raw_user_meta_data = '{"full_name": "Admin User"}'::jsonb,
    updated_at = now()
WHERE email = 'admin@maximisedai.com';

-- Ensure profile exists and is correct (upsert)
INSERT INTO profiles (id, email, app_role, created_at, updated_at)
SELECT 
    u.id, 
    'admin@maximisedai.com', 
    'super_admin', 
    now(), 
    now()
FROM auth.users u 
WHERE u.email = 'admin@maximisedai.com'
ON CONFLICT (id) 
DO UPDATE SET 
    email = 'admin@maximisedai.com',
    app_role = 'super_admin',
    updated_at = now();

-- Show final state
SELECT 'FINAL STATE:' as status;
SELECT 
    u.id, 
    u.email, 
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    u.raw_user_meta_data->>'full_name' as display_name,
    p.app_role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@maximisedai.com';

SELECT 'SUCCESS: Admin user updated with confirmed email. Login: admin@maximisedai.com / Temp123!' as result;