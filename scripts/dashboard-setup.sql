-- SUPABASE DASHBOARD SETUP SCRIPT
-- Copy and paste this entire script into your Supabase SQL Editor
-- IMPORTANT: Replace 'your-email@example.com' with your actual email address

-- Step 1: Create extensions and types
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create core tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    app_role app_role DEFAULT 'user'::app_role,
    admin_permissions text[] DEFAULT '{}',
    last_admin_login timestamptz,
    admin_notes text,
    is_suspended boolean DEFAULT false,
    suspended_at timestamptz,
    suspended_by uuid REFERENCES public.profiles(id),
    suspension_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.content_moderation_queue (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_type text NOT NULL,
    content_id uuid NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    flagged_at timestamptz DEFAULT now(),
    flag_reason text,
    status text DEFAULT 'pending',
    moderator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    moderated_at timestamptz,
    moderator_notes text,
    risk_score decimal(3,2) DEFAULT 0.0
);

-- Step 3: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation_queue ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND app_role IN ('admin', 'super_admin', 'moderator')
        )
    );

CREATE POLICY IF NOT EXISTS "Users can manage own brands" ON public.brands
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can manage own cvs" ON public.cvs
    FOR ALL USING (auth.uid() = user_id);

-- Step 5: Create essential functions
CREATE OR REPLACE FUNCTION get_admin_system_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'active_users_24h', (SELECT COUNT(*) FROM public.profiles WHERE created_at > now() - interval '24 hours'),
        'total_content_generated', (SELECT COUNT(*) FROM public.brands) + (SELECT COUNT(*) FROM public.cvs),
        'pending_moderation', (SELECT COUNT(*) FROM public.content_moderation_queue WHERE status = 'pending'),
        'total_users', (SELECT COUNT(*) FROM public.profiles)
    ) INTO result;
    RETURN result;
END;
$$;

-- Step 6: Set up your admin account
-- REPLACE 'your-email@example.com' WITH YOUR ACTUAL EMAIL!
INSERT INTO public.profiles (id, email, full_name, app_role, admin_permissions)
VALUES (
    gen_random_uuid(),
    'your-email@example.com',
    'Super Admin',
    'super_admin'::app_role,
    ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs']
)
ON CONFLICT (email) DO UPDATE SET
    app_role = 'super_admin'::app_role,
    admin_permissions = ARRAY['manage_users', 'moderate_content', 'manage_billing', 'view_analytics', 'manage_system', 'view_audit_logs'];

-- Step 7: Verification
SELECT 
    email,
    app_role,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE email = 'your-email@example.com';

-- Success message
SELECT 'Database setup complete! Your admin account is ready.' as status;