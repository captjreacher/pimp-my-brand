-- Seed Admin User Setup
-- This creates a dedicated admin user that you can log in with

-- First, ensure the app_role enum exists
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add app_role column to profiles if it doesn't exist
DO $$ BEGIN
    ALTER TABLE profiles ADD COLUMN app_role app_role DEFAULT 'user'::app_role;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Check if admin user already exists, if not create it
DO $$
DECLARE
    admin_user_id uuid;
    user_exists boolean := false;
BEGIN
    -- Check if user already exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@pimp-my-brand.com') INTO user_exists;
    
    IF NOT user_exists THEN
        -- Create the admin user
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
            recovery_token
        ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'admin@pimp-my-brand.com',
            crypt('TempAdmin123!', gen_salt('bf')), -- Temporary password: TempAdmin123!
            now(),
            now(),
            now(),
            '',
            '',
            '',
            ''
        );
    END IF;
    
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@pimp-my-brand.com';
    
    -- Check if profile exists, if not create it, otherwise update it
    IF EXISTS(SELECT 1 FROM profiles WHERE id = admin_user_id) THEN
        UPDATE profiles SET 
            app_role = 'super_admin'::app_role,
            updated_at = now()
        WHERE id = admin_user_id;
    ELSE
        INSERT INTO profiles (id, email, app_role, created_at, updated_at)
        VALUES (admin_user_id, 'admin@pimp-my-brand.com', 'super_admin'::app_role, now(), now());
    END IF;
END $$;

-- Verify the setup
SELECT 
    u.email,
    p.app_role,
    'Login with: admin@pimp-my-brand.com / TempAdmin123!' as login_info
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@pimp-my-brand.com';