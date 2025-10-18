-- Fix brands table schema
-- Add missing columns to the brands table

-- First, let's see what columns exist
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'brands';

-- Add missing columns if they don't exist
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tone_notes JSONB;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS signature_phrases TEXT[];
ALTER TABLE brands ADD COLUMN IF NOT EXISTS strengths TEXT[];
ALTER TABLE brands ADD COLUMN IF NOT EXISTS weaknesses TEXT[];
ALTER TABLE brands ADD COLUMN IF NOT EXISTS color_palette JSONB;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS fonts JSONB;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS format_preset TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS raw_context JSONB;

-- Update the table to ensure all columns are properly set
UPDATE brands SET 
  bio = COALESCE(bio, ''),
  tone_notes = COALESCE(tone_notes, '{}'),
  signature_phrases = COALESCE(signature_phrases, ARRAY[]::TEXT[]),
  strengths = COALESCE(strengths, ARRAY[]::TEXT[]),
  weaknesses = COALESCE(weaknesses, ARRAY[]::TEXT[]),
  color_palette = COALESCE(color_palette, '{}'),
  fonts = COALESCE(fonts, '{}'),
  format_preset = COALESCE(format_preset, 'custom'),
  logo_url = COALESCE(logo_url, ''),
  raw_context = COALESCE(raw_context, '{}')
WHERE bio IS NULL OR tone_notes IS NULL OR signature_phrases IS NULL 
   OR strengths IS NULL OR weaknesses IS NULL OR color_palette IS NULL 
   OR fonts IS NULL OR format_preset IS NULL OR logo_url IS NULL 
   OR raw_context IS NULL;