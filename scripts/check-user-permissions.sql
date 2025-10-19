-- Check current user permissions
SELECT 
    'Current User ID: ' || COALESCE(auth.uid()::text, 'NOT AUTHENTICATED') as user_info;

SELECT 
    'Email: ' || COALESCE(email, 'No email found') as email_info
FROM public.profiles 
WHERE id = auth.uid();

SELECT 
    'App Role: ' || COALESCE(app_role, 'No role set') as role_info
FROM public.profiles 
WHERE id = auth.uid();

SELECT 
    'Admin Permissions: ' || COALESCE(admin_permissions::text, 'No permissions set') as permissions_info
FROM public.profiles 
WHERE id = auth.uid();

-- Check if user has manage_billing permission
SELECT 
    CASE 
        WHEN auth.uid() IS NULL THEN 'NOT AUTHENTICATED'
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND 'manage_billing' = ANY(admin_permissions)
        ) THEN 'HAS manage_billing permission ✅'
        ELSE 'MISSING manage_billing permission ❌'
    END as billing_permission_check;