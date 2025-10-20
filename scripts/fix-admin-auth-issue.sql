-- Fix admin authentication issue
-- The 500 error suggests the user record is corrupted or has invalid data

-- First, check the current admin user state
SELECT 'CURRENT ADMIN USER STATE:' as section;
SELECT 
    id,
    email,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at,
    updated_at,
    aud,
    role,
    instance_id
FROM auth.users 
WHERE email = 'admin@maximisedai.com';

-- Check for any duplicate users
SELECT 'DUPLICATE CHECK:' as section;
SELECT email, COUNT(*) as count
FROM auth.users 
WHERE email = 'admin@maximisedai.com'
GROUP BY email
HAVING COUNT(*) > 1;

-- Delete any existing admin user and recreate cleanly
DELETE FROM profiles WHERE email = 'admin@maximisedai.com';
DELETE FROM auth.users WHERE email = 'admin@maximisedai.com';

-- Create a fresh admin user with proper fields
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Generate a new UUID for admin
    admin_user_id := gen_random_uuid();
    
    -- Insert into auth.users with all required fields
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        confirmation_token,
        recovery_sent_at,
        recovery_token,
        email_change_sent_at,
        email_change,
        email_change_token_new,
        email_change_token_current,
        raw_user_meta_data,
        raw_app_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        confirmed_at,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at,
        is_anonymous,
        aud,
        role
    ) VALUES (
        admin_user_id,
        '00000000-0000-0000-0000-000000000000',
        'admin@maximisedai.com',
        crypt('Admin123!', gen_salt('bf')),
        NOW(), -- email_confirmed_at
        NOW(), -- confirmation_sent_at
        '', -- confirmation_token (empty since confirmed)
        NULL, -- recovery_sent_at
        '', -- recovery_token
        NULL, -- email_change_sent_at
        '', -- email_change
        '', -- email_change_token_new
        '', -- email_change_token_current
        jsonb_build_object('full_name', 'System Administrator'),
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        false, -- is_super_admin
        NOW(),
        NOW(),
        NULL, -- phone
        NULL, -- phone_confirmed_at
        '', -- phone_change
        '', -- phone_change_token
        NULL, -- phone_change_sent_at
        NOW(), -- confirmed_at
        0, -- email_change_confirm_status
        NULL, -- banned_until
        '', -- reauthentication_token
        NULL, -- reauthentication_sent_at
        false, -- is_sso_user
        NULL, -- deleted_at
        false, -- is_anonymous
        'authenticated',
        'authenticated'
    );
    
    -- Create corresponding profile
    INSERT INTO profiles (
        id,
        email,
        app_role,
        full_name,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'admin@maximisedai.com',
        'super_admin',
        'System Administrator',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'SUCCESS: Clean admin user created with ID: %', admin_user_id;
    RAISE NOTICE 'Email: admin@maximisedai.com';
    RAISE NOTICE 'Password: Admin123!';
    RAISE NOTICE 'Status: CONFIRMED and READY';
END $$;

-- Verify the new user
SELECT 'VERIFICATION:' as section;
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at IS NOT NULL as confirmed,
    p.app_role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@maximisedai.com';

SELECT 'ADMIN USER RECREATED - TRY LOGIN NOW' as result;