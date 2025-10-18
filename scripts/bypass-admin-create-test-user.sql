-- Bypass admin completely - create a simple test user
-- This will work with your existing app without admin complexity

-- Clean up everything admin-related
DELETE FROM profiles WHERE email IN ('admin@maximisedai.com', 'test@test.com');
DELETE FROM auth.users WHERE email IN ('admin@maximisedai.com', 'test@test.com');

-- Create a simple test user that bypasses admin
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    aud,
    role
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'test@test.com',
    crypt('test123', gen_salt('bf')),
    NOW(),
    jsonb_build_object('full_name', 'Test User'),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
);

-- Create matching profile with regular user role
INSERT INTO profiles (
    id,
    email,
    app_role,
    full_name,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.email,
    'user',
    'Test User',
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'test@test.com';

-- Verify
SELECT 
    'TEST USER CREATED' as status,
    u.email,
    u.email_confirmed_at IS NOT NULL as confirmed,
    p.app_role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'test@test.com';