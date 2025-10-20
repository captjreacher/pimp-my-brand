-- Fix missing app_role column in profiles table
-- This script ensures the app_role enum exists and adds the column if missing

-- Step 1: Create the app_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add app_role column to profiles table if it doesn't exist
DO $$ 
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'app_role'
        AND table_schema = 'public'
    ) THEN
        -- Add the column
        ALTER TABLE public.profiles ADD COLUMN app_role public.app_role DEFAULT 'user';
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_profiles_app_role ON public.profiles(app_role);
        
        RAISE NOTICE 'Added app_role column to profiles table';
    ELSE
        RAISE NOTICE 'app_role column already exists in profiles table';
    END IF;
END $$;

-- Step 3: Add other admin-related columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_admin_login TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Step 4: Verify the structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('app_role', 'admin_permissions', 'last_admin_login')
ORDER BY column_name;

-- Step 5: Show current profiles with roles
SELECT 
    id,
    email,
    app_role,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE app_role IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;