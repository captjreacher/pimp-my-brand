-- STEP 1: Fix User Management Database Schema
-- Run this in Supabase Dashboard -> SQL Editor

-- Disable RLS for admin access
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Add ALL missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS app_role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS last_admin_action TEXT,
ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] DEFAULT '{}';

-- Make yourself super admin
UPDATE public.profiles 
SET 
    app_role = 'super_admin',
    admin_permissions = ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs']
WHERE email = 'mike@mikerobinson.co.nz' 
   OR id = 'ee575bff-b1d7-428c-b02c-94a702692975';

-- Verify the schema
SELECT 
    'Schema verification:' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('app_role', 'subscription_tier', 'is_suspended', 'suspended_at', 'suspended_by', 'suspension_reason', 'admin_notes', 'last_admin_action')
ORDER BY column_name;

-- Show current users
SELECT 
    'Current users:' as info,
    id,
    email,
    full_name,
    app_role,
    subscription_tier,
    is_suspended,
    created_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 10;