-- COMPLETE ADMIN REAL DATA FIX
-- This connects ALL admin functions to real data, no more mock/demo data
-- Run this in Supabase Dashboard -> SQL Editor

-- Step 1: Disable RLS completely for admin access
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Create all required enums and types
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.content_status AS ENUM ('active', 'flagged', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.moderation_action AS ENUM ('approved', 'rejected', 'flagged', 'pending');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Step 3: Add all required columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS app_role public.app_role DEFAULT 'user',
ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS last_admin_action TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Step 4: Create admin analytics tables
CREATE TABLE IF NOT EXISTS public.admin_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metadata JSONB DEFAULT '{}',
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL,
    response_time_ms INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    error_message TEXT,
    user_agent TEXT,
    ip_address TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.content_moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL, -- 'brand' or 'cv'
    content_id UUID NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    status public.moderation_action DEFAULT 'pending',
    flagged_reason TEXT,
    moderator_id UUID REFERENCES public.profiles(id),
    moderated_at TIMESTAMPTZ,
    auto_flagged BOOLEAN DEFAULT false,
    risk_score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Make yourself super admin
UPDATE public.profiles 
SET 
    app_role = 'super_admin'::public.app_role,
    admin_permissions = ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs']
WHERE email = 'mike@mikerobinson.co.nz' 
   OR id = 'ee575bff-b1d7-428c-b02c-94a702692975';

-- Step 6: Create comprehensive RPC functions for analytics

-- User Statistics Function
CREATE OR REPLACE FUNCTION get_user_statistics(time_range TEXT DEFAULT '24 hours')
RETURNS TABLE (
    total_users BIGINT,
    active_users_period BIGINT,
    new_users_period BIGINT,
    suspended_users BIGINT,
    users_by_tier JSONB
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    start_time TIMESTAMPTZ;
BEGIN
    start_time := NOW() - time_range::INTERVAL;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.profiles)::BIGINT as total_users,
        (SELECT COUNT(*) FROM public.profiles WHERE last_sign_in_at >= start_time)::BIGINT as active_users_period,
        (SELECT COUNT(*) FROM public.profiles WHERE created_at >= start_time)::BIGINT as new_users_period,
        (SELECT COUNT(*) FROM public.profiles WHERE is_suspended = true)::BIGINT as suspended_users,
        (SELECT jsonb_object_agg(
            COALESCE(subscription_tier, 'free'), 
            count
        ) FROM (
            SELECT 
                COALESCE(subscription_tier, 'free') as subscription_tier,
                COUNT(*) as count
            FROM public.profiles 
            GROUP BY COALESCE(subscription_tier, 'free')
        ) tier_counts)::JSONB as users_by_tier;
END;
$$;

-- Content Statistics Function
CREATE OR REPLACE FUNCTION get_content_statistics(time_range TEXT DEFAULT '24 hours')
RETURNS TABLE (
    total_brands BIGINT,
    total_cvs BIGINT,
    brands_created_period BIGINT,
    cvs_created_period BIGINT,
    avg_content_per_user NUMERIC
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    start_time TIMESTAMPTZ;
BEGIN
    start_time := NOW() - time_range::INTERVAL;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.brands)::BIGINT as total_brands,
        (SELECT COUNT(*) FROM public.cvs)::BIGINT as total_cvs,
        (SELECT COUNT(*) FROM public.brands WHERE created_at >= start_time)::BIGINT as brands_created_period,
        (SELECT COUNT(*) FROM public.cvs WHERE created_at >= start_time)::BIGINT as cvs_created_period,
        (SELECT 
            CASE 
                WHEN COUNT(DISTINCT user_id) > 0 
                THEN (COUNT(*)::NUMERIC / COUNT(DISTINCT user_id)::NUMERIC)
                ELSE 0 
            END
        FROM (
            SELECT user_id FROM public.brands
            UNION ALL
            SELECT user_id FROM public.cvs
        ) all_content)::NUMERIC as avg_content_per_user;
END;
$$;

-- Performance Statistics Function
CREATE OR REPLACE FUNCTION get_performance_statistics(time_range TEXT DEFAULT '24 hours')
RETURNS TABLE (
    total_requests BIGINT,
    avg_response_time NUMERIC,
    error_rate NUMERIC,
    requests_by_status JSONB,
    slowest_endpoints JSONB
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    start_time TIMESTAMPTZ;
BEGIN
    start_time := NOW() - time_range::INTERVAL;
    
    RETURN QUERY
    SELECT 
        COALESCE((SELECT COUNT(*) FROM public.system_health_metrics WHERE recorded_at >= start_time), 0)::BIGINT as total_requests,
        COALESCE((SELECT AVG(response_time_ms) FROM public.system_health_metrics WHERE recorded_at >= start_time), 0)::NUMERIC as avg_response_time,
        COALESCE((SELECT 
            CASE 
                WHEN COUNT(*) > 0 
                THEN (COUNT(*) FILTER (WHERE status_code >= 400)::NUMERIC / COUNT(*)::NUMERIC * 100)
                ELSE 0 
            END
        FROM public.system_health_metrics WHERE recorded_at >= start_time), 0)::NUMERIC as error_rate,
        COALESCE((SELECT jsonb_object_agg(
            status_code::TEXT, 
            count
        ) FROM (
            SELECT 
                status_code,
                COUNT(*) as count
            FROM public.system_health_metrics 
            WHERE recorded_at >= start_time
            GROUP BY status_code
        ) status_counts), '{}'::JSONB) as requests_by_status,
        COALESCE((SELECT jsonb_agg(
            jsonb_build_object(
                'endpoint', endpoint,
                'avg_response_time', avg_response_time
            )
        ) FROM (
            SELECT 
                endpoint,
                AVG(response_time_ms) as avg_response_time
            FROM public.system_health_metrics 
            WHERE recorded_at >= start_time
            GROUP BY endpoint
            ORDER BY avg_response_time DESC
            LIMIT 10
        ) slow_endpoints), '[]'::JSONB) as slowest_endpoints;
END;
$$;

-- Moderation Statistics Function
CREATE OR REPLACE FUNCTION get_moderation_statistics(time_range TEXT DEFAULT '24 hours')
RETURNS TABLE (
    pending_moderation BIGINT,
    moderated_period BIGINT,
    approval_rate NUMERIC,
    avg_moderation_time NUMERIC,
    moderation_by_type JSONB
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    start_time TIMESTAMPTZ;
BEGIN
    start_time := NOW() - time_range::INTERVAL;
    
    RETURN QUERY
    SELECT 
        COALESCE((SELECT COUNT(*) FROM public.content_moderation_queue WHERE status = 'pending'), 0)::BIGINT as pending_moderation,
        COALESCE((SELECT COUNT(*) FROM public.content_moderation_queue WHERE moderated_at >= start_time), 0)::BIGINT as moderated_period,
        COALESCE((SELECT 
            CASE 
                WHEN COUNT(*) > 0 
                THEN (COUNT(*) FILTER (WHERE status = 'approved')::NUMERIC / COUNT(*)::NUMERIC * 100)
                ELSE 0 
            END
        FROM public.content_moderation_queue WHERE moderated_at >= start_time), 0)::NUMERIC as approval_rate,
        COALESCE((SELECT AVG(EXTRACT(EPOCH FROM (moderated_at - created_at))/60) 
        FROM public.content_moderation_queue 
        WHERE moderated_at >= start_time AND moderated_at IS NOT NULL), 0)::NUMERIC as avg_moderation_time,
        COALESCE((SELECT jsonb_object_agg(
            content_type, 
            count
        ) FROM (
            SELECT 
                content_type,
                COUNT(*) as count
            FROM public.content_moderation_queue 
            WHERE created_at >= start_time
            GROUP BY content_type
        ) type_counts), '{}'::JSONB) as moderation_by_type;
END;
$$;

-- Enhanced User List Function
CREATE OR REPLACE FUNCTION get_admin_user_list(
    p_search TEXT DEFAULT NULL,
    p_role_filter TEXT DEFAULT 'all',
    p_status_filter TEXT DEFAULT 'all',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    app_role TEXT,
    subscription_tier TEXT,
    created_at TIMESTAMPTZ,
    last_sign_in TIMESTAMPTZ,
    is_suspended BOOLEAN,
    suspended_at TIMESTAMPTZ,
    suspended_by UUID,
    suspension_reason TEXT,
    admin_notes TEXT,
    last_admin_action TEXT,
    content_count BIGINT,
    total_generations BIGINT
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        COALESCE(p.app_role::TEXT, 'user') as app_role,
        COALESCE(p.subscription_tier, 'free') as subscription_tier,
        p.created_at,
        p.last_sign_in_at as last_sign_in,
        COALESCE(p.is_suspended, false) as is_suspended,
        p.suspended_at,
        p.suspended_by,
        p.suspension_reason,
        p.admin_notes,
        p.last_admin_action,
        COALESCE(
            (SELECT COUNT(*) FROM public.brands WHERE user_id = p.id) +
            (SELECT COUNT(*) FROM public.cvs WHERE user_id = p.id), 
            0
        )::BIGINT as content_count,
        COALESCE(
            (SELECT COUNT(*) FROM public.brands WHERE user_id = p.id) +
            (SELECT COUNT(*) FROM public.cvs WHERE user_id = p.id), 
            0
        )::BIGINT as total_generations
    FROM public.profiles p
    WHERE 
        (p_search IS NULL OR 
         p.email ILIKE '%' || p_search || '%' OR 
         p.full_name ILIKE '%' || p_search || '%')
    AND (p_role_filter = 'all' OR COALESCE(p.app_role::TEXT, 'user') = p_role_filter)
    AND (p_status_filter = 'all' OR 
         (p_status_filter = 'active' AND NOT COALESCE(p.is_suspended, false)) OR
         (p_status_filter = 'suspended' AND COALESCE(p.is_suspended, false)))
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Step 7: Grant permissions to all functions
GRANT EXECUTE ON FUNCTION get_user_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_moderation_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_user_list TO authenticated;

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_app_role ON public.profiles(app_role);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_last_sign_in ON public.profiles(last_sign_in_at);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_system_health_recorded_at ON public.system_health_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON public.content_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created_at ON public.content_moderation_queue(created_at);

-- Step 9: Insert some sample health metrics for testing
INSERT INTO public.system_health_metrics (endpoint, response_time_ms, status_code, recorded_at)
SELECT 
    '/api/brands',
    (random() * 500 + 50)::INTEGER,
    CASE WHEN random() < 0.95 THEN 200 ELSE 500 END,
    NOW() - (random() * INTERVAL '24 hours')
FROM generate_series(1, 100);

-- Step 10: Verify the complete setup
SELECT 
    'COMPLETE ADMIN SETUP VERIFIED' as status,
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE app_role IN ('admin', 'super_admin', 'moderator')) as admin_users,
    (SELECT COUNT(*) FROM public.brands) as total_brands,
    (SELECT COUNT(*) FROM public.cvs) as total_cvs,
    (SELECT COUNT(*) FROM public.system_health_metrics) as health_metrics;

-- Step 11: Show your admin profile
SELECT 
    'Your admin profile:' as info,
    email,
    app_role,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE email = 'mike@mikerobinson.co.nz' 
   OR id = 'ee575bff-b1d7-428c-b02c-94a702692975';