# 🚀 Simple Nuclear Reset Guide - Fresh Admin Setup

This guide uses a simpler approach that avoids the complex auth.users table manipulation by using Supabase's built-in signup functionality.

## ⚠️ WARNING
This will **PERMANENTLY DELETE ALL DATA** in your database. Only proceed if you want a completely fresh start.

## 📋 Prerequisites

1. Access to your Supabase dashboard
2. Node.js installed for testing scripts
3. Your Supabase credentials

## 🔥 Step-by-Step Simple Reset

### Step 1: Verify Environment
First, make sure your environment is set up correctly:

```bash
node scripts/verify-env.js
```

If this fails, create a `.env` file with:
```env
VITE_SUPABASE_URL=https://nfafvtyhmprzydxhebbm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYWZ2dHlocHJ6eWR4aGViYm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyOTAzNzI4NCwiZXhwIjoyMDQ0NjEzMjg0fQ.PEzZVjKeBzZD0-uhjHN-F8Sox9i4jDlj_NtvcUrUztQ
```

### Step 2: Execute Simple Nuclear Reset
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy the entire contents of `scripts/simple-nuclear-reset.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute

You should see output like:
```
SIMPLE NUCLEAR RESET COMPLETE
Database is clean and ready for admin signup
Use the signup script to create admin user
```

### Step 3: Create Admin User
Now create the admin user using Supabase's signup:

```bash
node scripts/create-admin-user.js
```

You should see:
```
🔧 Creating Admin User via Supabase Signup

1️⃣ Signing up admin user...
✅ Admin user signed up

3️⃣ Verifying admin profile...
✅ Profile verified

4️⃣ Testing admin login...
✅ Login test successful

5️⃣ Testing admin functions...
✅ Admin functions working

🎉 ADMIN USER CREATION SUCCESSFUL!
```

### Step 4: Verify the Complete Setup
Run the comprehensive test to make sure everything works:

```bash
node scripts/test-simple-reset.js
```

You should see all tests pass:
```
🧪 Testing Simple Nuclear Reset and Admin Setup

1️⃣ Testing database connection...
✅ Database connection successful

2️⃣ Checking admin user existence...
✅ Admin user found

3️⃣ Testing admin login...
✅ Login successful

... (all other tests)

🎉 ALL TESTS PASSED! Simple reset successful.
```

## 🎯 What This Simple Reset Does

### Database Changes
- **Completely wipes** all existing tables and data
- **Removes all RLS policies** that might cause conflicts
- **Deletes all users** from auth.users
- **Creates fresh, minimal tables**:
  - `profiles` - User profile data
  - `admin_sessions` - Admin session tracking
  - `admin_audit_logs` - Admin action logging

### Smart Admin Creation
- **Uses Supabase signup** instead of manual auth.users insertion
- **Auto-creates profile** via database trigger
- **Automatically assigns super_admin role** for admin@maximisedai.com
- **Handles email confirmation** properly

### Security Features
- **Simple RLS policies** (no recursion issues)
- **Admin session tracking**
- **Audit logging** for admin actions
- **Helper functions** for role checking

## 🔐 Admin Login Credentials

After the reset, you can log in with:
- **Email**: `admin@maximisedai.com`
- **Password**: `Admin123!`

## 🛠️ Troubleshooting

### If the SQL script fails:
1. Check you have the right permissions in Supabase
2. Make sure you're in the SQL Editor, not the Database tab
3. Try running the script in smaller chunks if needed

### If admin creation fails with email confirmation:
1. The script will show you a SQL command to run
2. Copy and paste it into Supabase SQL Editor
3. Run the admin creation script again

### If the test script fails:
1. Verify your `.env` file is correct
2. Make sure both SQL script and admin creation completed successfully
3. Check your Supabase project is active

### If login still doesn't work:
1. Clear your browser's localStorage
2. Try an incognito/private browser window
3. Check the browser console for errors

## 🎉 Success!

Once all tests pass, you have a completely fresh admin system ready to use. You can now:

1. Log in to your app with the admin credentials
2. Access all admin features
3. Start building on a clean foundation

This simple approach avoids the auth.users complexity while still giving you a pristine, working admin system.

## 📝 Key Differences from Complex Reset

- **Uses Supabase signup** instead of manual auth.users insertion
- **Leverages database triggers** for automatic profile creation
- **Avoids generated column issues** in auth.users
- **More reliable** and follows Supabase best practices
- **Easier to troubleshoot** if issues arise