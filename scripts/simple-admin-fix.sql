-- Simple admin user fix - minimal fields only
-- Delete and recreate with only essential fields

-- Clean up existing admin user
DELETE FROM profiles WHERE email = 'admin@maximisedai.com';
DELETE FROM auth.users WHERE email = 'admin@maximisedai.com';

-- Create admin user with minimal required fields
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    admin_user_id := gen_random_uuid();
    
    -- Insert with only essential fields
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
        admin_user_id,
        '00000000-0000-0000-0000-000000000000',
        'admin@maximisedai.com',
        crypt('Admin123!', gen_salt('bf')),
        NOW(),
        jsonb_build_object('full_name', 'System Administrator'),
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );
    
    -- Create profile
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
    
    RAISE NOTICE 'Admin user created: %', admin_user_id;
END $$;

-- Verify
SELECT 
    'SUCCESS' as status,
    u.email,
    u.email_confirmed_at IS NOT NULL as confirmed,
    p.app_role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@maximisedai.com';