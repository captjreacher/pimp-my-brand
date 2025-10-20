# Fresh Database Setup Guide

## Option 1: Reset Current Database (Recommended)

1. **Go to your Supabase Dashboard**
2. **Navigate to Settings → Database**
3. **Click "Reset Database"** (this will delete all data and tables)
4. **Confirm the reset**
5. **Run the setup script:**
   - Go to **SQL Editor** in your Supabase dashboard
   - Copy and paste the contents of `scripts/fresh-database-setup.sql`
   - Click **Run**

## Option 2: Create New Project (Alternative)

1. **Go to Supabase Dashboard**
2. **Create a new project**
3. **Update your `.env` file** with the new project credentials:
   ```
   VITE_SUPABASE_URL=your_new_project_url
   VITE_SUPABASE_ANON_KEY=your_new_anon_key
   ```
4. **Run the setup script** (same as above)

## After Setup

### Test Login Options:

**Option A: Use the test user (created by script):**
- Email: `test@example.com`
- Password: `password123`

**Option B: Sign up normally:**
- Go to your app's signup page
- Create a new account
- The profile will be created automatically

### What This Setup Includes:

✅ **Essential tables only:**
- `profiles` - User profile data
- `user_content` - Your app's content (CVs, brands, etc.)

✅ **Proper RLS policies:**
- Users can only see/edit their own data
- Secure by default

✅ **Automatic profile creation:**
- When users sign up, profiles are created automatically
- No manual intervention needed

✅ **Clean, working foundation:**
- No admin complexity
- No corrupted data
- Ready for your app to work immediately

### Next Steps:

1. **Test basic login/signup**
2. **Verify your app works**
3. **Add admin features later** (if needed) once the foundation is solid

This approach gives you a clean, working database that your app can use immediately without any of the previous corruption issues.