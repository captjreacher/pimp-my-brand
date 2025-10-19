-- STEP 1: Check your current permissions
-- Run this first to see what permissions you have

SELECT 
    'User ID: ' || COALESCE(auth.uid()::text, 'NOT LOGGED IN') as info;

SELECT 
    'Email: ' || COALESCE(email, 'No email') as email,
    'Role: ' || COALESCE(app_role, 'No role') as role,
    'Permissions: ' || COALESCE(admin_permissions::text, 'No permissions') as permissions
FROM public.profiles 
WHERE id = auth.uid();