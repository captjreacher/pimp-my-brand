-- Delete old user and create new admin user
-- New credentials: admin@maximisedai.com / Temp123! / display name: admin

-- Step 1: Delete the old user from profiles first
DELETE FROM profiles WHERE email = 'admin@funkmybrand.com';

-- Step 2: Delete from auth.users (this will cascade)
DELETE FROM auth.users WHERE email = 'admin@funkmybrand.com';

-- Step 3: Create new admin user
DO $$
DECLARE
    admin_uuid uuid := gen_random_uuid();
BEGIN
    -- Create the user in auth.users with the new credentials
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token,
        raw_user_meta_data
    ) VALUES (
        admin_uuid,
        '00000000-0000-0000-0000-000000000000',
        'admin@maximisedai.com',
        crypt('Temp123!', gen_salt('bf')),
        now(),
        now(),
        now(),
        '',
        '',
        '',
        '',
        '{"full_name": "admin"}'::jsonb
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

    RAISE NOTICE 'New admin user created with UUID: %', admin_uuid;
END $$;

-- Step 4: Verify the new user
SELECT 'VERIFICATION:' as step;
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.raw_user_meta_data->>'full_name' as display_name,
    p.app_role,
    'SUCCESS! New admin user created!' as status
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@maximisedai.com';