-- Complete Database Setup Script
-- This script sets up the entire database from scratch including admin functions
-- Replace 'your-email@example.com' with your actual email address

-- ============================================================================
-- STEP 1: Basic Infrastructure Setup
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create app_role enum
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Core Tables Setup
-- ============================================================================

-- Create profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    app_role app_role DEFAULT 'user'::app_role,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create brands table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.brands (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    colors jsonb DEFAULT '[]'::jsonb,
    fonts jsonb DEFAULT '{}'::jsonb,
    logo_url text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create cvs table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.cvs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
    title text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb,
    template_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- STEP 3: Admin Infrastructure
-- ============================================================================

-- Add admin columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS admin_permissions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_admin_login timestamptz,
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    action_type text NOT NULL,
    target_type text,
    target_id text,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- Create content moderation queue table
CREATE TABLE IF NOT EXISTS public.content_moderation_queue (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_type text NOT NULL, -- 'brand', 'cv', etc.
    content_id uuid NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    flagged_at timestamptz DEFAULT now(),
    flag_reason text,
    status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    moderator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    moderated_at timestamptz,
    moderator_notes text,
    risk_score decimal(3,2) DEFAULT 0.0
);

-- Create admin sessions table
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    session_token text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    last_activity timestamptz DEFAULT now()
);

-- Create system configuration table
CREATE TABLE IF NOT EXISTS public.system_config (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    config_key text UNIQUE NOT NULL,
    config_value jsonb NOT NULL,
    description text,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create admin alerts table
CREATE TABLE IF NOT EXISTS public.admin_alerts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    alert_type text NOT NULL,
    severity text NOT NULL, -- 'low', 'medium', 'high', 'critical'
    title text NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    acknowledged boolean DEFAULT false,
    acknowledged_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    acknowledged_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- STEP 4: Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for profiles
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admin policies
CREATE POLICY IF NOT EXISTS "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND app_role IN ('admin', 'super_admin', 'moderator')
        )
    );

CREATE POLICY IF NOT EXISTS "Admins can update user profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND app_role IN ('admin', 'super_admin')
        )
    );

-- Content policies
CREATE POLICY IF NOT EXISTS "Users can manage own brands" ON public.brands
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can manage own cvs" ON public.cvs
    FOR ALL USING (auth.uid() = user_id);

-- Admin audit log policies
CREATE POLICY IF NOT EXISTS "Admins can view audit logs" ON public.admin_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND app_role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY IF NOT EXISTS "Admins can insert audit logs" ON public.admin_audit_log
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND app_role IN ('admin', 'super_admin', 'moderator')
        )
    );

-- ============================================================================
-- STEP 5: Essential Functions
-- ============================================================================

-- Function to get admin system metrics
CREATE OR REPLACE FUNCTION get_admin_system_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND app_role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    SELECT jsonb_build_object(
        'active_users_24h', (
            SELECT COUNT(*) FROM public.profiles 
            WHERE created_at > now() - interval '24 hours'
        ),
        'total_content_generated', (
            SELECT COUNT(*) FROM public.brands
        ) + (
            SELECT COUNT(*) FROM public.cvs
        ),
        'pending_moderation', (
            SELECT COUNT(*) FROM public.content_moderation_queue 
            WHERE status = 'pending'
        ),
        'total_users', (
            SELECT COUNT(*) FROM public.profiles
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- Function to export user data (GDPR compliance)
CREATE OR REPLACE FUNCTION export_user_data_gdpr(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND app_role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    SELECT jsonb_build_object(
        'profile', (
            SELECT to_jsonb(p.*) FROM public.profiles p WHERE id = target_user_id
        ),
        'brands', (
            SELECT jsonb_agg(to_jsonb(b.*)) FROM public.brands b WHERE user_id = target_user_id
        ),
        'cvs', (
            SELECT jsonb_agg(to_jsonb(c.*)) FROM public.cvs c WHERE user_id = target_user_id
        ),
        'exported_at', now()
    ) INTO result;

    -- Log the export action
    INSERT INTO public.admin_audit_log (admin_user_id, action_type, target_type, target_id, details)
    VALUES (auth.uid(), 'gdpr_export', 'user', target_user_id::text, jsonb_build_object('exported_at', now()));

    RETURN result;
END;
$$;

-- ============================================================================
-- STEP 6: Set Up Your Admin Account
-- ============================================================================

-- IMPORTANT: Replace 'your-email@example.com' with your actual email address
-- This will make you a super admin with all permissions

-- First, let's create/update your profile
INSERT INTO public.profiles (id, email, full_name, app_role, admin_permissions)
SELECT 
    auth.uid(),
    'your-email@example.com',
    'Super Admin',
    'super_admin'::app_role,
    ARRAY[
        'manage_users',
        'moderate_content', 
        'manage_billing',
        'view_analytics',
        'manage_system',
        'view_audit_logs'
    ]
WHERE auth.uid() IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
    app_role = 'super_admin'::app_role,
    admin_permissions = ARRAY[
        'manage_users',
        'moderate_content', 
        'manage_billing',
        'view_analytics',
        'manage_system',
        'view_audit_logs'
    ];

-- If you don't have an auth.uid() (not logged in), update by email
UPDATE public.profiles 
SET 
    app_role = 'super_admin'::app_role,
    admin_permissions = ARRAY[
        'manage_users',
        'moderate_content', 
        'manage_billing',
        'view_analytics',
        'manage_system',
        'view_audit_logs'
    ]
WHERE email = 'your-email@example.com';

-- ============================================================================
-- STEP 7: Verification Queries
-- ============================================================================

-- Show your admin account
SELECT 
    id,
    email,
    full_name,
    app_role,
    admin_permissions,
    created_at
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

-- Show table counts
SELECT 
    'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'brands', COUNT(*) FROM public.brands
UNION ALL
SELECT 'cvs', COUNT(*) FROM public.cvs
UNION ALL
SELECT 'admin_audit_log', COUNT(*) FROM public.admin_audit_log;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

-- Your database is now set up with:
-- ✅ All required tables and functions
-- ✅ Row Level Security policies
-- ✅ Admin infrastructure
-- ✅ Your super admin account
-- 
-- Next steps:
-- 1. Replace 'your-email@example.com' with your actual email
-- 2. Run this script in your Supabase SQL Editor
-- 3. Sign up/login to your app with that email
-- 4. Visit /admin to access admin functions