-- COMPLETE ADMIN SETUP SCRIPT
-- This script sets up the admin infrastructure and makes you an admin

-- Step 1: Create the app_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add app_role column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS app_role app_role DEFAULT 'user';

-- Step 3: Add admin-specific fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Step 4: Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50), -- 'user', 'content', 'subscription', etc.
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create admin sessions tracking table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create content moderation queue table
CREATE TABLE IF NOT EXISTS content_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL, -- 'brand' or 'cv'
  content_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  flagged_by UUID REFERENCES auth.users(id),
  flag_reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  moderator_id UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create system configuration table
CREATE TABLE IF NOT EXISTS admin_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_type ON admin_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_is_active ON admin_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_content_moderation_queue_status ON content_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_moderation_queue_content_type ON content_moderation_queue(content_type);
CREATE INDEX IF NOT EXISTS idx_profiles_app_role ON profiles(app_role);

-- Step 9: Make Mike Robinson a super admin
UPDATE public.profiles 
SET app_role = 'super_admin'
WHERE id = 'bdc1eedc-87e5-43ae-9304-16e673986696';

-- Step 10: Verify the setup worked
SELECT 
    'Admin infrastructure created successfully!' as status;

-- Step 11: Show your updated profile
SELECT 
    id,
    app_role,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = 'bdc1eedc-87e5-43ae-9304-16e673986696';

-- Step 12: Show available app roles
SELECT unnest(enum_range(NULL::app_role)) as available_roles;