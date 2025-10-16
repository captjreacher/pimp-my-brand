-- Admin Setup Script
-- Replace 'your-email@example.com' with your actual email address

-- Create the app_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update your user to have super_admin role
-- IMPORTANT: Replace 'your-email@example.com' with your actual email
UPDATE profiles 
SET app_role = 'super_admin'
WHERE email = 'your-email@example.com';

-- Add admin permissions to the profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS admin_permissions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_admin_login timestamptz,
ADD COLUMN IF NOT EXISTS admin_notes text;

-- Grant all admin permissions to super_admin users
UPDATE profiles 
SET admin_permissions = ARRAY[
    'manage_users',
    'moderate_content', 
    'manage_billing',
    'view_analytics',
    'manage_system',
    'view_audit_logs'
]
WHERE app_role = 'super_admin';

-- Verify the setup
SELECT 
    id, 
    email, 
    app_role, 
    admin_permissions,
    full_name,
    created_at
FROM profiles 
WHERE email = 'your-email@example.com';

-- Show all admin users
SELECT 
    email,
    app_role,
    admin_permissions,
    created_at
FROM profiles 
WHERE app_role IN ('admin', 'super_admin', 'moderator')
ORDER BY created_at DESC;