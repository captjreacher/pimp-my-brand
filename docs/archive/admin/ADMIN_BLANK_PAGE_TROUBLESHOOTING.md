# Admin Blank Page Troubleshooting Guide

## Problem
The admin page at `/admin` appears blank or shows a loading screen indefinitely.

## Quick Solutions

### 1. Try Alternative Admin Pages
If the main admin page is blank, try these working alternatives:

- **`/admin/minimal`** - Simple admin interface (recommended)
- **`/admin/fallback`** - Basic admin fallback
- **`/admin/test`** - Admin test page
- **`/admin/direct`** - Direct admin test (bypasses auth)

### 2. Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for any red error messages
4. Copy and paste this script to run diagnostics:

```javascript
// Copy and paste this entire script into the browser console
console.log('=== ADMIN DIAGNOSTIC ===');
console.log('URL:', window.location.href);
console.log('Supabase available:', typeof window.supabase !== 'undefined');
console.log('React available:', typeof React !== 'undefined');
console.log('Page content length:', document.body.innerHTML.length);
console.log('Loading elements:', document.querySelectorAll('[data-testid*="loading"]').length);
console.log('Error elements:', document.querySelectorAll('[role="alert"]').length);
if (window.supabase) {
  window.supabase.auth.getUser().then(({data, error}) => {
    console.log('Current user:', data.user?.email || 'Not logged in');
    console.log('Auth error:', error);
  });
}
```

### 3. Check Authentication Status
Run this script in the browser console to test admin authentication:

```javascript
// Test admin authentication
async function testAuth() {
  if (!window.supabase) {
    console.log('❌ Supabase not available');
    return;
  }
  
  const { data: { user }, error } = await window.supabase.auth.getUser();
  if (error || !user) {
    console.log('❌ Not logged in');
    return;
  }
  
  const { data: profile } = await window.supabase
    .from('profiles')
    .select('app_role')
    .eq('id', user.id)
    .single();
    
  console.log('User:', user.email);
  console.log('Role:', profile?.app_role || 'No role');
  console.log('Is Admin:', ['admin', 'super_admin', 'moderator'].includes(profile?.app_role));
}
testAuth();
```

## Common Causes and Solutions

### 1. Authentication Loop
**Symptoms:** Page shows loading spinner indefinitely
**Solution:** 
- Try `/admin/minimal` which bypasses complex auth
- Clear browser cache and cookies
- Log out and log back in

### 2. Missing Admin Role
**Symptoms:** "Access Denied" or infinite loading
**Solution:** Update your user role in the database:
```sql
UPDATE profiles SET app_role = 'admin' WHERE email = 'your-email@example.com';
```

### 3. JavaScript Errors
**Symptoms:** Blank white page
**Solution:** 
- Check browser console for errors
- Try `/admin/minimal` for a simpler interface
- Refresh the page

### 4. Network Issues
**Symptoms:** Loading forever, network errors in console
**Solution:**
- Check internet connection
- Verify Supabase connection
- Try `/admin/fallback` for offline mode

### 5. Component Rendering Issues
**Symptoms:** Partial loading, broken layout
**Solution:**
- Try `/admin/direct` to test dashboard rendering
- Check for missing dependencies
- Clear browser cache

## Step-by-Step Troubleshooting

### Step 1: Basic Checks
1. Are you logged in? Check `/dashboard` first
2. Do you have admin role? Run the auth test script above
3. Are there console errors? Check browser developer tools

### Step 2: Try Alternative Pages
1. Go to `/admin/minimal` - This should always work
2. If minimal works, the issue is with the main admin auth
3. If minimal doesn't work, there's a deeper routing issue

### Step 3: Database Checks
Run these SQL queries in Supabase dashboard:

```sql
-- Check your user profile
SELECT id, email, app_role FROM profiles WHERE email = 'your-email@example.com';

-- Check if admin tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'admin_%';

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename LIKE 'admin_%';
```

### Step 4: Reset Admin Access
If nothing works, try this emergency reset:

```sql
-- Make yourself admin (replace with your email)
UPDATE profiles SET app_role = 'admin' WHERE email = 'your-email@example.com';

-- Verify the change
SELECT email, app_role FROM profiles WHERE email = 'your-email@example.com';
```

## Working Admin Routes

These routes should work regardless of the main admin page issue:

- **`/admin/minimal`** ✅ Always works - Simple admin interface
- **`/admin/fallback`** ✅ Basic admin with minimal dependencies  
- **`/admin/test`** ✅ Admin test page with diagnostics
- **`/admin/direct`** ✅ Direct dashboard test (bypasses auth)
- **`/admin/users`** ✅ User management (if authenticated)
- **`/admin/analytics`** ✅ Analytics page (if authenticated)

## Emergency Admin Access

If you're completely locked out:

1. Go to `/admin/minimal` - This bypasses complex authentication
2. Use the browser console scripts above to diagnose issues
3. Check your database role with the SQL queries above
4. Contact support with the diagnostic information

## Prevention

To prevent this issue in the future:

1. Always test admin access after deployments
2. Keep the `/admin/minimal` route as a backup
3. Monitor browser console for errors
4. Regularly verify admin user roles in the database

## Need Help?

If none of these solutions work:

1. Copy the output from the diagnostic script
2. Note which alternative admin pages work/don't work
3. Include any console errors
4. Provide your user email and expected role

The minimal admin interface at `/admin/minimal` should always work as a fallback.