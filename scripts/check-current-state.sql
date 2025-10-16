-- Check current database state to understand the admin user situation

-- Check all users in auth.users
SELECT 'AUTH USERS:' as section;
SELECT id, email, created_at, email_confirmed_at, 
       raw_user_meta_data->>'full_name' as display_name
FROM auth.users 
ORDER BY created_at;

-- Check all profiles
SELECT 'PROFILES:' as section;
SELECT id, email, app_role, created_at
FROM profiles 
ORDER BY created_at;

-- Check for any admin users specifically
SELECT 'ADMIN USERS:' as section;
SELECT u.id, u.email, u.created_at, p.app_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email LIKE '%admin%' OR p.app_role = 'super_admin'
ORDER BY u.created_at;