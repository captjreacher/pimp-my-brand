# Admin Functions Setup Guide

## How to Access Admin Functions

### Step 1: Set Up Database
First, make sure all the database migrations are applied. The admin functions require several database tables and the `app_role` enum.

### Step 2: Grant Admin Permissions
You need to update your user profile to have admin permissions. You can do this in several ways:

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run this query (replace with your email):

```sql
-- Create the app_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update your user to have super_admin role
UPDATE profiles 
SET app_role = 'super_admin'
WHERE email = 'your-email@example.com';
```

#### Option B: Using the setup script
1. Open `scripts/setup-admin.sql`
2. Replace `'your-email@example.com'` with your actual email
3. Run the script in your Supabase SQL Editor

### Step 3: Access Admin Functions

Once you have admin permissions, you can access the admin functions in several ways:

#### Direct URLs:
- **Admin Dashboard**: `http://localhost:8080/admin`
- **User Management**: `http://localhost:8080/admin/users`
- **Communication**: `http://localhost:8080/admin/communication`
- **Analytics**: `http://localhost:8080/admin/analytics`
- **System Config**: `http://localhost:8080/admin/config`
- **Security**: `http://localhost:8080/admin/security`

#### Admin Access Helper:
Visit `http://localhost:8080/admin-access` to see all available admin functions and your current permissions.

## Available Admin Functions

### 1. **Communication & Support** (`/admin/communication`)
- Send direct messages to users
- Create platform-wide announcements
- Manage support tickets
- Broadcast system notifications
- Handle maintenance alerts and security notices

### 2. **User Management** (`/admin/users`)
- View and manage all users
- Suspend/activate user accounts
- Change user roles and permissions
- Add admin notes to user profiles
- Bulk user operations

### 3. **Analytics** (`/admin/analytics`)
- System performance metrics
- User analytics and engagement
- Content moderation statistics
- Real-time system health monitoring

### 4. **System Configuration** (`/admin/config`)
- Manage system settings
- Configure feature flags
- Set up API integrations
- Manage rate limiting
- Import/export configurations

### 5. **Security** (`/admin/security`)
- Monitor login attempts
- Configure MFA settings
- Manage security policies
- View security logs

### 6. **Content Moderation** (`/admin/moderation`)
- Review flagged content
- Moderate user-generated content
- Manage moderation queue
- Auto-flagging configuration

## User Roles

The system supports four user roles:

- **user**: Regular users (default)
- **moderator**: Can moderate content and manage basic user issues
- **admin**: Full admin access except system configuration
- **super_admin**: Full access to all admin functions

## Troubleshooting

### "Access Denied" Error
- Make sure your user has the correct `app_role` in the database
- Check that all migrations have been applied
- Verify you're signed in with the correct account

### Admin Pages Not Loading
- Ensure all admin routes are properly configured in `App.tsx`
- Check that the AdminProvider is wrapping the admin routes
- Verify the AdminRouteGuard is working correctly

### Database Errors
- Make sure all migrations in `supabase/migrations/` have been applied
- Check that the `app_role` enum exists in your database
- Verify RLS policies are properly configured

## Security Notes

- Admin functions are protected by Row Level Security (RLS)
- All admin actions are logged in the `admin_audit_log` table
- Admin sessions are tracked for security monitoring
- Always use the principle of least privilege when assigning roles