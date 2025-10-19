-- Check your admin status and permissions
SELECT 
    'Current User:' as info,
    COALESCE(auth.uid()::text, 'NOT AUTHENTICATED') as user_id;

SELECT 
    'User Details:' as info,
    email,
    app_role,
    admin_permissions
FROM public.profiles 
WHERE id = auth.uid();

-- Check if you should have billing access based on role
SELECT 
    CASE 
        WHEN app_role = 'super_admin' THEN '✅ SUPER ADMIN - Should have ALL permissions including billing'
        WHEN app_role = 'admin' THEN '✅ ADMIN - Should have billing permission'
        WHEN app_role = 'moderator' THEN '❌ MODERATOR - No billing access'
        WHEN app_role = 'user' THEN '❌ USER - No admin access'
        ELSE '❓ UNKNOWN ROLE: ' || COALESCE(app_role, 'NULL')
    END as role_analysis
FROM public.profiles 
WHERE id = auth.uid();