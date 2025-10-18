# 🎯 Simple Database Setup Guide

Since the automated scripts aren't working, let's set up your database manually using the Supabase Dashboard.

## Step 1: Enable Row Level Security

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your `funkmybrand-production` project
3. Go to **SQL Editor**
4. Run this basic setup:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB,
  style_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Create policy for brands
CREATE POLICY "Users can manage own brands" ON public.brands
  FOR ALL USING (auth.uid() = user_id);

-- Create CVs table
CREATE TABLE IF NOT EXISTS public.cvs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB,
  style_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on CVs
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;

-- Create policy for CVs
CREATE POLICY "Users can manage own CVs" ON public.cvs
  FOR ALL USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 2: Create Storage Bucket

1. In your Supabase Dashboard, go to **Storage**
2. Click **Create Bucket**
3. Settings:
   - **Name**: `uploads`
   - **Public**: No (keep private)
   - **File size limit**: 50MB

## Step 3: Test the Setup

Run this to test your database:

```bash
node scripts/test-supabase-connection.js
```

## Step 4: Build and Test Locally

```bash
# Install dependencies (if needed)
npm install

# Build the application
npm run build

# Test locally
npm run preview
```

## Step 5: Create Your First Admin User

1. Visit your local app: http://localhost:4173
2. Sign up with your email
3. After signup, go back to Supabase SQL Editor and run:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE public.profiles 
SET role = 'admin', is_admin = true 
WHERE email = 'your-email@example.com';
```

## Step 6: Deploy to Production

Once everything works locally:

```bash
# Build for production
npm run build

# Create deployment package
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
Compress-Archive -Path "dist\*" -DestinationPath "deployments\funkmybrand-fresh-$timestamp.zip" -Force
```

Then upload to your Spaceship hosting.

## 🎯 What This Gives You

- ✅ **Basic user authentication** with Supabase Auth
- ✅ **User profiles** with admin role support
- ✅ **Brands and CVs tables** for core functionality
- ✅ **Row Level Security** for data protection
- ✅ **File storage** for uploads
- ✅ **Clean database** with no old users

## 🚀 Next Steps After Setup

1. **Test user registration** and login
2. **Create your first brand** or CV
3. **Set up OpenAI API** for AI features
4. **Deploy to production**
5. **Add more admin features** as needed

This minimal setup will get your FunkMyBrand app working with a fresh, clean database! 🎸