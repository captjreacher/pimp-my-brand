-- QUICK FIX: Connect Admin Dashboard to Real Data
-- Copy and paste this into Supabase Dashboard -> SQL Editor -> Run

-- Step 1: Disable RLS to allow admin access
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Create app_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Add admin columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_role public.app_role DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_by UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Step 4: Make you super admin
UPDATE public.profiles 
SET 
    app_role = 'super_admin'::public.app_role,
    admin_permissions = ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs']
WHERE email = 'mike@mikerobinson.co.nz' 
   OR id = 'ee575bff-b1d7-428c-b02c-94a702692975';

-- Step 5: Verify setup
SELECT 
    'SUCCESS: Admin setup complete' as status,
    email,
    app_role,
    admin_permissions
FROM public.profiles 
WHERE app_role = 'super_admin';

-- Step 6: Show all users for admin dashboard
SELECT 
    'All users for admin dashboard:' as info,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE app_role IN ('admin', 'super_admin', 'moderator')) as admin_users
FROM public.profiles;