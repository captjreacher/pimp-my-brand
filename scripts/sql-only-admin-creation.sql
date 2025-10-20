-- SQL-ONLY Admin Creation Script
-- This bypasses all JavaScript/API key issues and creates admin directly in database

-- Step 1: Create the admin user directly in auth.users
DO $$
DECLARE
    admin_user_id UUID;
    encrypted_pass TEXT;
BEGIN
    -- Generate a new UUID for admin
    admin_user_id := gen_random_uuid();
    
    -- Create encrypted password using Supabase's built-in function
    encrypted_pass := crypt('Admin123!', gen_salt('bf'));
    
    -- Insert into auth.users with minimal required fields
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
        encrypted_pass,
        NOW(), -- Email confirmed immediately
        jsonb_build_object('full_name', 'System Administrator'),
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );
    
    -- Insert corresponding profile (trigger should handle this, but let's be explicit)
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
    ) ON CONFLICT (id) DO UPDATE SET
        app_role = 'super_admin',
        full_name = 'System Administrator';
    
    -- Log the admin creation
    INSERT INTO admin_audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        admin_user_id,
        'ADMIN_CREATED',
        'user',
        admin_user_id::text,
        jsonb_build_object('method', 'sql_direct', 'email', 'admin@maximisedai.com')
    );
    
    RAISE NOTICE 'SUCCESS: Admin user created with ID: %', admin_user_id;
    RAISE NOTICE 'Email: admin@maximisedai.com';
    RAISE NOTICE 'Password: Admin123!';
    RAISE NOTICE 'Role: super_admin';
    RAISE NOTICE 'Email Status: CONFIRMED';
END $$;

-- Step 2: Verify the creation
SELECT 
    'ADMIN USER VERIFICATION' as section,
    u.id,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    p.app_role,
    p.full_name
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@maximisedai.com';

-- Step 3: Test the helper functions
SELECT 
    'HELPER FUNCTION TEST' as section,
    is_admin(u.id) as is_admin_result,
    get_user_role(u.id) as user_role
FROM auth.users u
WHERE u.email = 'admin@maximisedai.com';

SELECT 'ADMIN CREATION COMPLETE - READY TO LOGIN' as status;