-- Comprehensive Database Schema Audit and Fix
-- This script ensures all tables have the required columns for the application

-- ============================================================================
-- BRANDS TABLE
-- ============================================================================
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tone_notes JSONB DEFAULT '{}';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS signature_phrases TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE brands ADD COLUMN IF NOT EXISTS strengths TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE brands ADD COLUMN IF NOT EXISTS weaknesses TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE brands ADD COLUMN IF NOT EXISTS color_palette JSONB DEFAULT '{}';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS fonts JSONB DEFAULT '{}';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS format_preset TEXT DEFAULT 'custom';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS raw_context JSONB DEFAULT '{}';

-- ============================================================================
-- CVS TABLE
-- ============================================================================
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '[]';
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]';
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS format_preset TEXT DEFAULT 'custom';

-- ============================================================================
-- UPLOADS TABLE
-- ============================================================================
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS original_name TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS size_bytes INTEGER;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- ============================================================================
-- SHARES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('brand', 'cv')),
  target_id UUID NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for shares
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shares
DROP POLICY IF EXISTS "Users can view own shares" ON shares;
DROP POLICY IF EXISTS "Users can insert own shares" ON shares;
DROP POLICY IF EXISTS "Users can update own shares" ON shares;
DROP POLICY IF EXISTS "Users can delete own shares" ON shares;
DROP POLICY IF EXISTS "Public can view shared content" ON shares;

CREATE POLICY "Users can view own shares" ON shares
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shares" ON shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shares" ON shares
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shares" ON shares
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public can view shared content" ON shares
  FOR SELECT USING (true);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  plan_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- USAGE_TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for usage_tracking
DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Users can insert own usage" ON usage_tracking;

CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PROFILES TABLE EXTENSIONS
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS socials JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- UPDATE EXISTING RECORDS WITH DEFAULT VALUES
-- ============================================================================

-- Update brands table
UPDATE brands SET 
  tagline = COALESCE(tagline, title),
  bio = COALESCE(bio, 'Professional bio will be generated'),
  tone_notes = COALESCE(tone_notes, '{}'),
  signature_phrases = COALESCE(signature_phrases, ARRAY[]::TEXT[]),
  strengths = COALESCE(strengths, ARRAY[]::TEXT[]),
  weaknesses = COALESCE(weaknesses, ARRAY[]::TEXT[]),
  color_palette = COALESCE(color_palette, '{}'),
  fonts = COALESCE(fonts, '{}'),
  format_preset = COALESCE(format_preset, 'custom'),
  logo_url = COALESCE(logo_url, ''),
  raw_context = COALESCE(raw_context, '{}')
WHERE tagline IS NULL OR bio IS NULL OR tone_notes IS NULL 
   OR signature_phrases IS NULL OR strengths IS NULL OR weaknesses IS NULL 
   OR color_palette IS NULL OR fonts IS NULL OR format_preset IS NULL 
   OR logo_url IS NULL OR raw_context IS NULL;

-- Update cvs table
UPDATE cvs SET 
  summary = COALESCE(summary, 'Professional summary will be generated'),
  experience = COALESCE(experience, '[]'),
  skills = COALESCE(skills, ARRAY[]::TEXT[]),
  links = COALESCE(links, '[]'),
  format_preset = COALESCE(format_preset, 'custom')
WHERE summary IS NULL OR experience IS NULL OR skills IS NULL 
   OR links IS NULL OR format_preset IS NULL;

-- Update uploads table
UPDATE uploads SET 
  storage_path = COALESCE(storage_path, ''),
  original_name = COALESCE(original_name, 'unknown'),
  mime_type = COALESCE(mime_type, 'application/octet-stream'),
  size_bytes = COALESCE(size_bytes, 0),
  extracted_text = COALESCE(extracted_text, '')
WHERE storage_path IS NULL OR original_name IS NULL OR mime_type IS NULL 
   OR size_bytes IS NULL OR extracted_text IS NULL;

-- Update profiles table
UPDATE profiles SET 
  display_name = COALESCE(display_name, email),
  bio = COALESCE(bio, ''),
  role_tags = COALESCE(role_tags, ARRAY[]::TEXT[]),
  socials = COALESCE(socials, '{}'),
  last_updated = COALESCE(last_updated, NOW())
WHERE display_name IS NULL OR bio IS NULL OR role_tags IS NULL 
   OR socials IS NULL OR last_updated IS NULL;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify all tables have the required columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('brands', 'cvs', 'uploads', 'shares', 'subscriptions', 'usage_tracking', 'profiles')
ORDER BY table_name, ordinal_position;