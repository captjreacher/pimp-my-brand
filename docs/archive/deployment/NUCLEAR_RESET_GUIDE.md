# 🚀 Nuclear Reset Guide - Fresh Admin Setup

This guide will completely wipe your database and create a fresh admin system from scratch.

## ⚠️ WARNING
This will **PERMANENTLY DELETE ALL DATA** in your database. Only proceed if you want a completely fresh start.

## 📋 Prerequisites

1. Access to your Supabase dashboard
2. Node.js installed for testing scripts
3. Your Supabase credentials

## 🔥 Step-by-Step Nuclear Reset

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

### Step 2: Execute Nuclear Reset
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy the entire contents of `scripts/nuclear-reset-and-setup.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute

You should see output like:
```
NUCLEAR RESET COMPLETE - FRESH DATABASE READY
ADMIN USER VERIFICATION
Email: admin@maximisedai.com
Password: Admin123!
Role: super_admin
```

### Step 3: Verify the Setup
Run the comprehensive test to make sure everything works:

```bash
node scripts/test-nuclear-reset.js
```

You should see all tests pass:
```
🚀 Testing Nuclear Reset and Fresh Admin Setup

1️⃣ Testing database connection...
✅ Database connection successful

2️⃣ Checking admin user existence...
✅ Admin user found

3️⃣ Testing admin login...
✅ Login successful

4️⃣ Testing authenticated profile access...
✅ Profile access successful

5️⃣ Verifying admin privileges...
✅ Admin privileges confirmed

6️⃣ Testing admin session creation...
✅ Admin session created

7️⃣ Testing audit log creation...
✅ Audit log created

8️⃣ Testing helper functions...
✅ Helper functions working

🎉 ALL TESTS PASSED! Nuclear reset successful.
```

## 🎯 What This Reset Does

### Database Changes
- **Completely wipes** all existing tables and data
- **Removes all RLS policies** that might cause conflicts
- **Deletes all users** from auth.users
- **Creates fresh, minimal tables**:
  - `profiles` - User profile data
  - `admin_sessions` - Admin session tracking
  - `admin_audit_logs` - Admin action logging

### Admin User Creation
- **Email**: `admin@maximisedai.com`
- **Password**: `Admin123!`
- **Role**: `super_admin`
- **Status**: Email confirmed and ready to use

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

### If the test script fails:
1. Verify your `.env` file is correct
2. Make sure the SQL script completed successfully
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

The nuclear reset eliminates all the accumulated issues and gives you a pristine, working admin system.