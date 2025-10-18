-- Complete brands table fix
-- Add all missing columns that the brand generation needs

-- Add all missing columns
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

-- Set default values for existing records
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

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'brands' 
ORDER BY ordinal_position;