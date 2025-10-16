# Supabase Setup Guide

## Current Status
- ❌ Invalid login credentials error
- ❌ Supabase connection issues

## Quick Fix Steps

### Step 1: Verify Supabase Connection
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Find your project: `cwodhdvryibqoljaybzj`
3. Check if the project is active and accessible

### Step 2: Set Up Database Tables
1. In Supabase Dashboard, go to **SQL Editor**
2. Run this script to create the profiles table:

```sql
-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Step 3: Add Admin Column
After the profiles table exists, run:

```sql
-- Add app_role enum and column
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE profiles ADD COLUMN app_role app_role DEFAULT 'user'::app_role;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
```

### Step 4: Create Your Account
1. Go to your app: http://localhost:3000
2. Click "Sign up" and create an account
3. Verify your email if required

### Step 5: Make Yourself Admin
1. In Supabase Dashboard → SQL Editor
2. Find your user ID:
```sql
SELECT id, email FROM auth.users ORDER BY created_at DESC;
```
3. Make yourself admin:
```sql
UPDATE profiles SET app_role = 'super_admin' WHERE id = 'YOUR_USER_ID_HERE';
```

## Troubleshooting

### If you get "relation profiles does not exist"
- Run Step 2 first to create the profiles table

### If you get "Invalid login credentials"
- Make sure you've created an account through the app first
- Check that your email is verified

### If connection still fails
- Verify your Supabase project is active
- Check the environment variables in `.env`
- Try the connection test: `node scripts/test-connection.js`