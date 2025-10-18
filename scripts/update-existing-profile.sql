-- Update existing profile instead of recreating
-- The profile exists but the auth.users record was deleted

-- First check what we have
SELECT 'CURRENT STATE:' as section;
SELECT 'Auth users:' as type, COUNT(*) as count FROM auth.users WHERE email = 'admin@maximisedai.com';
SELECT 'Profiles:' as type, COUNT(*) as count FROM profiles WHERE email = 'admin@maximisedai.com';

-- Get the existing profile ID
DO $$
DECLARE
    existing_profile_id UUID;
BEGIN
    -- Get the existing profile ID
    SELECT id INTO existing_profile_id FROM profiles WHERE email = 'admin@maximisedai.com';
    
    IF existing_profile_id IS NOT NULL THEN
        -- Delete any auth.users record with this ID (in case it exists but is broken)
        DELETE FROM auth.users WHERE id = existing_profile_id;
        
        -- Create new auth.users record with the same ID as the existing profile
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
            existing_profile_id,
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
        
        -- Update the existing profile to ensure it's correct
        UPDATE profiles 
        SET 
            app_role = 'super_admin',
            full_name = 'System Administrator',
            updated_at = NOW()
        WHERE id = existing_profile_id;
        
        RAISE NOTICE 'Updated existing profile: %', existing_profile_id;
    ELSE
        RAISE NOTICE 'No existing profile found';
    END IF;
END $$;

-- Verify the result
SELECT 
    'FINAL STATE:' as section,
    u.email,
    u.email_confirmed_at IS NOT NULL as confirmed,
    p.app_role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@maximisedai.com';