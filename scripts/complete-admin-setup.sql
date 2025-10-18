-- Complete admin setup script
-- This will set up everything needed for admin functionality
-- Run this in your Supabase SQL Editor

-- Step 1: Create the app_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Ensure profiles table has all required columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_role public.app_role DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_admin_login TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_by UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Step 3: Create admin tables
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL,
  content_id UUID NOT NULL,
  user_id UUID NOT NULL,
  flagged_by UUID,
  flag_reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  moderator_id UUID,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_app_role ON public.profiles(app_role);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_is_active ON admin_sessions(is_active);

-- Step 5: Create admin functions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action_type VARCHAR(50),
  p_admin_user_id UUID DEFAULT NULL,
  p_target_type VARCHAR(50) DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
  current_user_id UUID;
BEGIN
  -- Use provided user ID or get current authenticated user
  current_user_id := COALESCE(p_admin_user_id, auth.uid());
  
  INSERT INTO admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    details,
    user_agent
  ) VALUES (
    current_user_id,
    p_action_type,
    p_target_type,
    p_target_id,
    CASE WHEN p_details IS NOT NULL THEN p_details::jsonb ELSE NULL END,
    p_user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

CREATE OR REPLACE FUNCTION start_admin_session(
  p_user_id UUID DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id UUID;
  current_user_id UUID;
BEGIN
  -- Use provided user ID or get current authenticated user
  current_user_id := COALESCE(p_user_id, auth.uid());
  
  -- End any existing active sessions
  UPDATE admin_sessions 
  SET is_active = false, session_end = NOW()
  WHERE user_id = current_user_id AND is_active = true;
  
  -- Create new session
  INSERT INTO admin_sessions (
    user_id,
    user_agent
  ) VALUES (
    current_user_id,
    p_user_agent
  ) RETURNING id INTO session_id;
  
  -- Log the admin login
  PERFORM log_admin_action(
    'admin_login',
    current_user_id,
    'session',
    session_id,
    jsonb_build_object('session_id', session_id)::text,
    p_user_agent
  );
  
  RETURN session_id;
END;
$$;

CREATE OR REPLACE FUNCTION end_admin_session(
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Use provided user ID or get current authenticated user
  current_user_id := COALESCE(p_user_id, auth.uid());
  
  UPDATE admin_sessions 
  SET is_active = false, session_end = NOW()
  WHERE user_id = current_user_id AND is_active = true;
  
  -- Log the admin logout
  PERFORM log_admin_action('admin_logout', current_user_id, 'session', NULL);
  
  RETURN true;
END;
$$;

-- Step 6: Set up RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND app_role IN ('admin', 'super_admin', 'moderator')
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND app_role IN ('admin', 'super_admin')
        )
    );

-- Admin audit log policies
CREATE POLICY "Admins can view audit logs" ON admin_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND app_role IN ('admin', 'super_admin')
    )
  );

-- Admin sessions policies
CREATE POLICY "Admins can view own sessions" ON admin_sessions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND app_role IN ('admin', 'moderator', 'super_admin')
    )
  );

-- Content moderation policies
CREATE POLICY "Moderators can access moderation queue" ON content_moderation_queue
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND app_role IN ('admin', 'moderator', 'super_admin')
    )
  );

-- Admin config policies
CREATE POLICY "Super admins can manage config" ON admin_config
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND app_role = 'super_admin'
    )
  );

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION start_admin_session TO authenticated;
GRANT EXECUTE ON FUNCTION end_admin_session TO authenticated;

-- Step 8: Insert default config
INSERT INTO admin_config (key, value, description) VALUES
  ('max_session_duration', '"8 hours"', 'Maximum duration for admin sessions')
ON CONFLICT (key) DO NOTHING;

-- Step 9: Create a super admin user (you'll need to update the email)
-- IMPORTANT: Replace 'your-email@example.com' with your actual email
DO $$
BEGIN
    -- Temporarily disable RLS and foreign key constraints
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    
    -- Delete any existing profile with this email
    DELETE FROM public.profiles WHERE email = 'your-email@example.com';
    
    -- Create the admin user
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        app_role, 
        admin_permissions,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'your-email@example.com',  -- CHANGE THIS TO YOUR EMAIL
        'Super Admin',
        'super_admin'::public.app_role,
        ARRAY[
            'manage_users',
            'moderate_content', 
            'manage_billing',
            'view_analytics',
            'manage_system',
            'view_audit_logs'
        ],
        NOW(),
        NOW()
    );
    
    -- Re-enable RLS
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Super admin user created successfully';
EXCEPTION
    WHEN OTHERS THEN
        -- Re-enable RLS even if there's an error
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        RAISE;
END $$;

-- Step 10: Verification
SELECT 
    'Setup verification:' as status,
    'Admin user created' as result,
    id,
    email,
    full_name,
    app_role::text as role,
    admin_permissions
FROM public.profiles 
WHERE app_role IN ('admin', 'super_admin', 'moderator')
ORDER BY created_at DESC;

SELECT 
    'Database setup complete!' as status,
    'Admin functions ready' as result;