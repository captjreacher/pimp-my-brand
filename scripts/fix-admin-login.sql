-- Fix admin login by resetting password and ensuring proper user status
-- Based on the current state showing admin@maximisedai.com exists with super_admin role

-- First, let's see the current user status
SELECT 'CURRENT ADMIN USER STATUS:' as info;
SELECT 
    id, 
    email, 
    email_confirmed_at,
    phone_confirmed_at,
    confirmed_at,
    created_at,
    raw_user_meta_data->>'full_name' as display_name
FROM auth.users 
WHERE email = 'admin@maximisedai.com';

-- Update the user with a fresh password and confirm the email
UPDATE auth.users 
SET 
    encrypted_password = crypt('Temp123!', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    raw_user_meta_data = jsonb_build_object('full_name', 'Admin User'),
    updated_at = now()
WHERE email = 'admin@maximisedai.com';

-- Ensure the profile exists and is correct
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

-- Verify the final state
SELECT 'UPDATED ADMIN USER:' as info;
SELECT 
    u.id, 
    u.email, 
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    u.raw_user_meta_data->>'full_name' as display_name,
    p.app_role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@maximisedai.com';

SELECT 'SUCCESS: Admin login should now work with admin@maximisedai.com / Temp123!' as result;