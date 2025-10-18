-- NUCLEAR RESET: Complete Database Wipe and Fresh Admin Setup
-- This script completely destroys and rebuilds everything from scratch

-- Step 1: Nuclear cleanup - Drop ALL custom tables and policies
DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS admin_audit_logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_content CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS cvs CASCADE;
DROP TABLE IF EXISTS content_moderation CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Drop all custom policies (this removes any problematic RLS)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.tablename || '_policy') || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.tablename || '_select') || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.tablename || '_insert') || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.tablename || '_update') || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.tablename || '_delete') || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Step 2: Clean auth.users table (remove all existing users)
DELETE FROM auth.users;

-- Step 3: Create minimal profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    app_role TEXT NOT NULL DEFAULT 'user' CHECK (app_role IN ('user', 'admin', 'super_admin')),
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create admin infrastructure tables
CREATE TABLE admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
    ip_address INET,
    user_agent TEXT
);

CREATE TABLE admin_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Enable RLS with SIMPLE policies (no recursion)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Simple, non-recursive policies
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own_or_admin" ON profiles FOR UPDATE USING (
    auth.uid() = id OR 
    auth.uid() IN (SELECT id FROM profiles WHERE app_role IN ('admin', 'super_admin'))
);

CREATE POLICY "admin_sessions_own" ON admin_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "admin_audit_read_admin" ON admin_audit_logs FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE app_role IN ('admin', 'super_admin'))
);

-- Step 6: Create indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_app_role ON profiles(app_role);
CREATE INDEX idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX idx_admin_audit_logs_user_id ON admin_audit_logs(user_id);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);

-- Step 7: Create the admin user with proper auth setup
DO $$
DECLARE
    admin_user_id UUID;
    encrypted_pass TEXT;
BEGIN
    -- Generate a new UUID for admin
    admin_user_id := gen_random_uuid();
    
    -- Create encrypted password
    encrypted_pass := crypt('Admin123!', gen_salt('bf'));
    
    -- Insert into auth.users with only the fields we can set
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        raw_user_meta_data,
        raw_app_meta_data,
        created_at,
        updated_at,
        email_change_confirm_status,
        is_sso_user,
        is_anonymous,
        aud,
        role
    ) VALUES (
        admin_user_id,
        '00000000-0000-0000-0000-000000000000',
        'admin@maximisedai.com',
        encrypted_pass,
        NOW(), -- email confirmed
        NOW(),
        jsonb_build_object('full_name', 'System Administrator', 'role', 'super_admin'),
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        NOW(),
        NOW(),
        0,
        false,
        false,
        'authenticated',
        'authenticated'
    );
    
    -- Insert corresponding profile
    INSERT INTO profiles (
        id,
        email,
        app_role,
        full_name,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'admin@maximisedai.com',
        'super_admin',
        'System Administrator',
        NOW(),
        NOW()
    );
    
    -- Log the admin creation
    INSERT INTO admin_audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        admin_user_id,
        'ADMIN_CREATED',
        'user',
        admin_user_id::text,
        jsonb_build_object('method', 'database_setup', 'email', 'admin@maximisedai.com')
    );
    
    RAISE NOTICE 'Admin user created successfully with ID: %', admin_user_id;
END $$;

-- Step 8: Create helper functions for admin operations
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND app_role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT app_role FROM profiles 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Verification and status report
SELECT 'NUCLEAR RESET COMPLETE - FRESH DATABASE READY' as status;

SELECT 
    'ADMIN USER VERIFICATION' as section,
    u.id,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    u.confirmed_at IS NOT NULL as account_confirmed,
    p.app_role,
    p.full_name
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@maximisedai.com';

SELECT 'ADMIN LOGIN CREDENTIALS' as info;
SELECT 'Email: admin@maximisedai.com' as credential;
SELECT 'Password: Admin123!' as credential;
SELECT 'Role: super_admin' as credential;

-- Final verification
SELECT 
    'DATABASE HEALTH CHECK' as section,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE app_role = 'super_admin') as admin_count
FROM profiles;