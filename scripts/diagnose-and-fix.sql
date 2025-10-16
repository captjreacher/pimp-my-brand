-- Diagnose and fix admin access for admin@funkmybrand.com

-- Step 1: Check if user exists in auth.users
SELECT 'AUTH USER CHECK:' as step;
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'admin@funkmybrand.com';

-- Step 2: Check if profile exists
SELECT 'PROFILE CHECK:' as step;
SELECT id, email, app_role, created_at 
FROM profiles 
WHERE email = 'admin@funkmybrand.com';

-- Step 3: Check if app_role column exists
SELECT 'COLUMN CHECK:' as step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'app_role';

-- Step 4: Make you admin (this will work if profile exists)
UPDATE profiles 
SET app_role = 'super_admin' 
WHERE email = 'admin@funkmybrand.com';

-- Step 5: Verify the fix
SELECT 'FINAL RESULT:' as step;
SELECT u.id, u.email, p.app_role, 'SUCCESS - You are now super_admin!' as status
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@funkmybrand.com';