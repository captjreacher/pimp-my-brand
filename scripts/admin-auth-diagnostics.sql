-- Comprehensive admin authentication diagnostics
-- Run this to understand the current state

-- Check 1: User exists and status
SELECT 'USER STATUS CHECK' as diagnostic_step;
SELECT 
    id,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    phone_confirmed_at IS NOT NULL as phone_confirmed,
    created_at,
    updated_at,
    raw_user_meta_data,
    aud,
    role
FROM auth.users 
WHERE email = 'admin@maximisedai.com';

-- Check 2: Profile exists and role
SELECT 'PROFILE CHECK' as diagnostic_step;
SELECT 
    id,
    email,
    app_role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'admin@maximisedai.com';

-- Check 3: Check for any auth policies that might block
SELECT 'AUTH POLICIES CHECK' as diagnostic_step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'auth' OR tablename = 'profiles';

-- Check 4: Verify password hash exists
SELECT 'PASSWORD CHECK' as diagnostic_step;
SELECT 
    email,
    encrypted_password IS NOT NULL as has_password,
    length(encrypted_password) as password_length
FROM auth.users 
WHERE email = 'admin@maximisedai.com';

-- Check 5: Look for any admin sessions or audit logs
SELECT 'ADMIN SESSIONS CHECK' as diagnostic_step;
SELECT COUNT(*) as session_count
FROM admin_sessions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@maximisedai.com');

-- Check 6: Verify RLS policies on profiles
SELECT 'PROFILES RLS CHECK' as diagnostic_step;
SELECT 
    schemaname, 
    tablename, 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT 'DIAGNOSTICS COMPLETE' as result;