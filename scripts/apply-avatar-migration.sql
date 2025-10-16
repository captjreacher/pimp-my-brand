-- This script adds avatar_url support to the brands table
-- Run this in your Supabase SQL editor or via CLI

-- Add avatar_url column to brands table
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.brands.avatar_url IS 'URL to the brand avatar/profile image';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'brands' AND column_name = 'avatar_url';