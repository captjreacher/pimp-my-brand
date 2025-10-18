-- Recreate brands table with all required columns
-- This will backup existing data and recreate the table

-- Create backup table
CREATE TABLE IF NOT EXISTS brands_backup AS SELECT * FROM brands;

-- Drop and recreate brands table
DROP TABLE IF EXISTS brands CASCADE;

CREATE TABLE brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT,
  bio TEXT,
  tone_notes JSONB DEFAULT '{}',
  signature_phrases TEXT[] DEFAULT ARRAY[]::TEXT[],
  strengths TEXT[] DEFAULT ARRAY[]::TEXT[],
  weaknesses TEXT[] DEFAULT ARRAY[]::TEXT[],
  color_palette JSONB DEFAULT '{}',
  fonts JSONB DEFAULT '{}',
  format_preset TEXT DEFAULT 'custom',
  logo_url TEXT,
  raw_context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own brands" ON brands
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brands" ON brands
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brands" ON brands
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brands" ON brands
  FOR DELETE USING (auth.uid() = user_id);

-- Restore data from backup if it exists
INSERT INTO brands (id, user_id, title, tagline, created_at, updated_at)
SELECT id, user_id, title, 
       COALESCE(tagline, title) as tagline,
       created_at, updated_at
FROM brands_backup
ON CONFLICT (id) DO NOTHING;

-- Drop backup table
DROP TABLE IF EXISTS brands_backup;