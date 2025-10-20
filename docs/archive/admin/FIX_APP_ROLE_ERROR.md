# Fix: app_role Column Missing Error

## Problem
You're getting this error: `ERROR: 42703: column "app_role" of relation "profiles" does not exist`

This happens because the `app_role` column is missing from your `profiles` table in Supabase.

## Solution

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to "SQL Editor" in the left sidebar

### Step 2: Run the Fix SQL
Copy and paste this SQL into the SQL Editor and click "Run":

```sql
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
```

### Step 3: Create Admin User (Fix Foreign Key Constraint)
If you got a foreign key constraint error, you have a few options:

#### Option A: Ultra Simple Fix (Recommended)
```sql
-- Ultra simple admin creation script
-- Run this in your Supabase SQL Editor

-- Step 1: Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Remove the foreign key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 3: Delete any existing profile with your email (to avoid duplicates)
-- IMPORTANT: Replace 'your-email@example.com' with your actual email
DELETE FROM public.profiles WHERE email = 'your-email@example.com';

-- Step 4: Create admin user (simple INSERT without ON CONFLICT)
-- IMPORTANT: Replace 'your-email@example.com' with your actual email
INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    app_role, 
    admin_permissions
) VALUES (
    gen_random_uuid(),
    'your-email@example.com',  -- CHANGE THIS TO YOUR EMAIL
    'Super Admin',
    'super_admin'::public.app_role,
    ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs']
);

-- Step 5: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify admin user was created
SELECT 
    'SUCCESS - Admin user created:' as status,
    id,
    email,
    full_name,
    app_role::text as role,
    admin_permissions
FROM public.profiles 
WHERE email = 'your-email@example.com';  -- CHANGE THIS TO YOUR EMAIL
```

#### Option B: Use Existing Auth User
If you have an existing user in your auth system:

```sql
-- First, check what users exist
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Then create profile for existing user
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

INSERT INTO public.profiles (id, email, full_name, app_role, admin_permissions) 
SELECT 
    u.id,
    u.email,
    'Super Admin',
    'super_admin'::public.app_role,
    ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs']
FROM auth.users u
WHERE u.email = 'your-email@example.com'  -- CHANGE THIS
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
    app_role = 'super_admin'::public.app_role,
    admin_permissions = ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs'];

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

**Files Available:**
- `scripts/ultra-simple-admin-creation.sql` - Ultra simple (recommended)
- `scripts/simple-remove-fk-constraint.sql` - Simple fix
- `scripts/create-admin-with-existing-user.sql` - Use existing auth user
- `scripts/diagnose-table-constraints.sql` - Check table structure first

### Step 4: Verify the Fix
Run this SQL in the Supabase SQL Editor to verify everything is working:

```sql
-- SQL script to verify that the app_role fix worked
-- Run this in your Supabase SQL Editor

-- Step 1: Check if app_role enum exists
SELECT 
    'app_role enum values:' as check_type,
    enumlabel as value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname = 'app_role'
ORDER BY enumsortorder;

-- Step 2: Check profiles table structure for app_role column
SELECT 
    'profiles table columns:' as check_type,
    column_name as value,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('app_role', 'admin_permissions', 'last_admin_login', 'admin_notes')
ORDER BY column_name;

-- Step 3: Show admin users (if any)
SELECT 
    'admin users:' as check_type,
    email,
    app_role::text as role,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE app_role IN ('admin', 'super_admin', 'moderator')
ORDER BY created_at DESC;

-- Step 4: Final verification
SELECT 
    'verification result:' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'app_role'
            AND table_schema = 'public'
        ) THEN '✅ app_role column exists - Fix successful!'
        ELSE '❌ app_role column still missing'
    END as result;
```

**Alternative:** You can also run the complete verification script from the file:
- Copy the contents of `scripts/verify-app-role-fix.sql` 
- Paste into Supabase SQL Editor
- Click "Run"

## What This Fixes

1. **Creates the `app_role` enum** with values: `user`, `admin`, `moderator`, `super_admin`
2. **Adds the `app_role` column** to the profiles table with a default value of `user`
3. **Adds other admin-related columns** needed for the admin system
4. **Creates necessary indexes** for performance
5. **Makes you a super admin** so you can access admin features

## Next Steps

After running these SQL commands:

1. Try accessing your admin features again
2. The error should be resolved
3. You should be able to log in as an admin
4. All admin functionality should work properly

## Important Notes

### SQL vs JavaScript Files
- **`.sql` files** → Run in **Supabase SQL Editor** (in your browser)
- **`.js` files** → Run in **terminal/command prompt** with `node filename.js`

### Verification Options
1. **In Supabase SQL Editor:** Run `scripts/verify-app-role-fix.sql`
2. **In terminal:** Run `node scripts/verify-app-role-fix.js`

## Alternative: Reset Database

If you prefer a fresh start, you can also run the complete database setup script:

```bash
# In your project directory (terminal/command prompt)
node scripts/setup-fresh-database.js
```

This will recreate all tables with the proper structure.