-- Fresh Database Setup - Essential tables only
-- Run this on your new/reset Supabase database

-- 1. Create profiles table (essential for your app)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create simple RLS policies for profiles (drop existing first)
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON profiles;

CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. Create your app's content tables (based on your existing app structure)
CREATE TABLE IF NOT EXISTS user_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL, -- 'cv', 'brand', etc.
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable RLS on user_content
ALTER TABLE user_content ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for user_content (drop existing first)
DROP POLICY IF EXISTS "user_content_select_own" ON user_content;
DROP POLICY IF EXISTS "user_content_insert_own" ON user_content;
DROP POLICY IF EXISTS "user_content_update_own" ON user_content;
DROP POLICY IF EXISTS "user_content_delete_own" ON user_content;

CREATE POLICY "user_content_select_own" ON user_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_content_insert_own" ON user_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_content_update_own" ON user_content FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_content_delete_own" ON user_content FOR DELETE USING (auth.uid() = user_id);

-- 9. Create a test user (optional - you can also sign up normally)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Only create if no users exist
    IF NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
        test_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_user_meta_data,
            raw_app_meta_data,
            created_at,
            updated_at,
            aud,
            role
        ) VALUES (
            test_user_id,
            '00000000-0000-0000-0000-000000000000',
            'test@example.com',
            crypt('password123', gen_salt('bf')),
            NOW(),
            jsonb_build_object('full_name', 'Test User'),
            jsonb_build_object('provider', 'email', 'providers', array['email']),
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        );
        
        RAISE NOTICE 'Test user created: test@example.com / password123';
    ELSE
        RAISE NOTICE 'Users already exist, skipping test user creation';
    END IF;
END $$;

-- 10. Verify setup
SELECT 'SETUP VERIFICATION:' as status;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_content')
ORDER BY table_name;

SELECT 'RLS enabled:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'user_content');

SELECT 'SETUP COMPLETE - Your app should now work!' as result;