-- Update Mike's existing profile to admin
-- Run this in your Supabase SQL Editor

-- Step 1: Check current profile
SELECT 
    'Mike current profile:' as status,
    id,
    email,
    full_name,
    role,
    app_role::text as app_role_text,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE id = 'ee575bff-b1d7-428c-b02c-94a702692975';

-- Step 2: Temporarily disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Update Mike's profile to super admin
UPDATE public.profiles 
SET 
    app_role = 'super_admin'::public.app_role,
    admin_permissions = ARRAY[
        'manage_users',
        'moderate_content', 
        'manage_billing',
        'view_analytics',
        'manage_system',
        'view_audit_logs'
    ],
    full_name = COALESCE(full_name, 'Mike G Robinson'),
    updated_at = NOW()
WHERE id = 'ee575bff-b1d7-428c-b02c-94a702692975';

-- Step 4: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the update worked
SELECT 
    'Mike profile after update:' as status,
    id,
    email,
    full_name,
    role,
    app_role::text as app_role_text,
    admin_permissions,
    updated_at
FROM public.profiles 
WHERE id = 'ee575bff-b1d7-428c-b02c-94a702692975';

-- Step 6: Show all admin users
SELECT 
    'All admin users:' as status,
    email,
    app_role::text as role,
    admin_permissions
FROM public.profiles 
WHERE app_role IN ('admin', 'super_admin', 'moderator')
ORDER BY created_at DESC;