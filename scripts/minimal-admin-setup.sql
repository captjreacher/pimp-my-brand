-- Minimal Admin Setup - Just add the column and make your existing account admin

-- Step 1: Create the enum type (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add app_role column to profiles (if it doesn't exist)
DO $$ BEGIN
    ALTER TABLE profiles ADD COLUMN app_role app_role DEFAULT 'user'::app_role;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Step 3: Show all current users so you can find your ID
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;