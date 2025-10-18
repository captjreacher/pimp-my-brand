-- Make a user a super admin
-- Replace 'your-email@example.com' with your actual email address

-- Update user to have super admin privileges
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
    last_admin_login = NOW()
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT 
    id,
    email,
    full_name,
    app_role,
    admin_permissions,
    created_at,
    updated_at
FROM public.profiles 
WHERE email = 'your-email@example.com';

-- Show all admin users
SELECT 
    email,
    app_role,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE app_role IN ('admin', 'super_admin', 'moderator')
ORDER BY created_at DESC;