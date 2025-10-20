-- SIMPLE NUCLEAR RESET: Clean database with admin user via signup
-- This approach uses Supabase's built-in functions to avoid auth.users complexity

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

-- Drop all custom policies
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

-- Step 7: Create helper functions for admin operations
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

-- Step 8: Create trigger to auto-create profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, app_role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        CASE 
            WHEN NEW.email = 'admin@maximisedai.com' THEN 'super_admin'
            ELSE 'user'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 9: Status report
SELECT 'SIMPLE NUCLEAR RESET COMPLETE' as status;
SELECT 'Database is clean and ready for admin signup' as message;
SELECT 'Use the signup script to create admin user' as next_step;