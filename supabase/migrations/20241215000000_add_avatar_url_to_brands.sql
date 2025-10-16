-- Add avatar_url column to brands table
ALTER TABLE public.brands ADD COLUMN avatar_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.brands.avatar_url IS 'URL to the brand avatar/profile image';