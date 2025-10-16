-- FIX ADMIN ROLE SETUP
-- This script adds the missing app_role column and makes you admin

-- Step 1: Create the app_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add app_role column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS app_role app_role DEFAULT 'user';

-- Step 3: Make you a super admin
UPDATE public.profiles 
SET app_role = 'super_admin'
WHERE id = 'bdc1eedc-87e5-43ae-9304-16e673986696';

-- Step 4: Verify it worked
SELECT 
    'SUCCESS: You are now a super admin!' as message,
    id,
    app_role,
    created_at
FROM public.profiles 
WHERE id = 'bdc1eedc-87e5-43ae-9304-16e673986696';

-- Step 5: Show all available roles
SELECT 
    'Available app roles:' as info,
    unnest(enum_range(NULL::app_role)) as role;