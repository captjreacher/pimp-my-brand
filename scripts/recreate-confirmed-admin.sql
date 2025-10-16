-- Recreate admin user with email confirmation from the start
-- This will delete the existing user and create a new one with proper confirmation

-- First, show what we're starting with
SELECT 'BEFORE CLEANUP:' as status;
SELECT u.id, u.email, u.email_confirmed_at IS NOT NULL as email_confirmed, p.app_role 
FROM auth.users u 
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@maximisedai.com';

-- Clean up existing admin user and profile (delete by ID to handle constraints)
DO $$
DECLARE
    existing_user_id uuid;
BEGIN
    -- Get the existing user ID
    SELECT id INTO existing_user_id FROM auth.users WHERE email = 'admin@maximisedai.com';
    
    IF existing_user_id IS NOT NULL THEN
        -- Delete profile first (child record)
        DELETE FROM profiles WHERE id = existing_user_id;
        -- Then delete user (parent record)
        DELETE FROM auth.users WHERE id = existing_user_id;
        RAISE NOTICE 'Deleted existing admin user with ID: %', existing_user_id;
    ELSE
        RAISE NOTICE 'No existing admin user found to delete';
    END IF;
END $$;

-- Create a new admin user with email already confirmed
DO $$
DECLARE
    admin_uuid uuid;
BEGIN
    -- Generate a new UUID for the admin user
    admin_uuid := gen_random_uuid();
    
    -- Insert the user with email confirmation
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        created_at,
        updated_at,
        aud,
        role
    ) VALUES (
        admin_uuid,
        '00000000-0000-0000-0000-000000000000',
        'admin@maximisedai.com',
        crypt('Temp123!', gen_salt('bf')),
        now(), -- Email is confirmed immediately
        '{"full_name": "Admin User"}'::jsonb,
        now(),
        now(),
        'authenticated',
        'authenticated'
    );
    
    -- Create the profile
    INSERT INTO profiles (
        id,
        email,
        app_role,
        created_at,
        updated_at
    ) VALUES (
        admin_uuid,
        'admin@maximisedai.com',
        'super_admin',
        now(),
        now()
    );
    
    RAISE NOTICE 'Created admin user with ID: %', admin_uuid;
END $$;

-- Verify the new user
SELECT 'AFTER CREATION:' as status;
SELECT 
    u.id, 
    u.email, 
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    u.raw_user_meta_data->>'full_name' as display_name,
    p.app_role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@maximisedai.com';

SELECT 'SUCCESS: New admin user created with confirmed email. Login with admin@maximisedai.com / Temp123!' as result;