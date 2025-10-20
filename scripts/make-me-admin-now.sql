-- Quick Admin Setup Script
-- Run this in your Supabase SQL Editor to make yourself an admin

-- First, create the app_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add app_role column to profiles if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN app_role public.app_role DEFAULT 'user';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update your user to have super_admin role
-- REPLACE 'your-email@example.com' WITH YOUR ACTUAL EMAIL
UPDATE public.profiles 
SET app_role = 'super_admin'
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT id, email, app_role, created_at 
FROM public.profiles 
WHERE email = 'your-email@example.com';

-- If no rows returned, you might need to create a profile first
-- Check if you have a profile:
SELECT auth.users.email, profiles.email, profiles.app_role
FROM auth.users 
LEFT JOIN public.profiles ON auth.users.id = profiles.id
WHERE auth.users.email = 'your-email@example.com';