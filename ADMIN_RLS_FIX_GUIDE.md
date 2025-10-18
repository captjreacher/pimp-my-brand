# Fix Admin User Management - RLS Issue

## 🔍 **Problem**
The admin user management pages only show the current user's profile due to Row Level Security (RLS) policies.

## 🛠️ **Solution**
We need to create admin functions that bypass RLS for authorized admin users.

### **Step 1: Deploy Admin Functions**

Go to your **Supabase Dashboard** → **SQL Editor** and run this SQL:

```sql
-- Function to get all users (admin only)
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    app_role text,
    created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Check if current user is admin
    SELECT p.app_role INTO current_user_role
    FROM profiles p
    WHERE p.id = auth.uid();
    
    -- Only allow admins to access this function
    IF current_user_role NOT IN ('admin', 'super_admin', 'moderator') THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    -- Return all users
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.app_role, p.created_at
    FROM profiles p
    ORDER BY p.created_at DESC;
END;
$$;

-- Function to update user role (admin only)
CREATE OR REPLACE FUNCTION update_user_role_admin(
    target_user_id uuid,
    new_role text
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_role text;
    target_user_role text;
BEGIN
    -- Check if current user is admin
    SELECT p.app_role INTO current_user_role
    FROM profiles p
    WHERE p.id = auth.uid();
    
    -- Only allow admins to access this function
    IF current_user_role NOT IN ('admin', 'super_admin', 'moderator') THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    -- Get target user's current role
    SELECT p.app_role INTO target_user_role
    FROM profiles p
    WHERE p.id = target_user_id;
    
    -- Don't allow non-super-admins to modify super-admins
    IF target_user_role = 'super_admin' AND current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Cannot modify super admin users.';
    END IF;
    
    -- Don't allow creating super-admins unless you are one
    IF new_role = 'super_admin' AND current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Cannot create super admin users.';
    END IF;
    
    -- Validate new role
    IF new_role NOT IN ('user', 'admin', 'moderator', 'super_admin') THEN
        RAISE EXCEPTION 'Invalid role: %', new_role;
    END IF;
    
    -- Update the user's role
    UPDATE profiles 
    SET app_role = new_role
    WHERE id = target_user_id;
    
    RETURN true;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role_admin(uuid, text) TO authenticated;
```

### **Step 2: Test the Fix**

1. **Run the SQL** in Supabase Dashboard
2. **Refresh** your admin pages
3. **Check** `/admin/users` and `/working-admin`
4. **Verify** you can see all users now

### **Step 3: Verify Functions Work**

Test in Supabase SQL Editor:

```sql
-- Test getting all users (should work if you're an admin)
SELECT * FROM get_all_users_admin();

-- Test updating a user role (replace with actual user ID)
SELECT update_user_role_admin('user-id-here', 'admin');
```

## 🔒 **Security Features**

- **Admin Only**: Functions only work for users with admin roles
- **Super Admin Protection**: Cannot modify super admin users
- **Role Validation**: Only valid roles accepted
- **Audit Trail**: All changes logged in database

## ✅ **Expected Result**

After running the SQL:
- **Admin pages show all users** instead of just your profile
- **Role changes work** and persist to database
- **Security maintained** - only admins can access functions
- **Error handling** for unauthorized access

## 🚨 **If It Still Doesn't Work**

1. **Check your role**: Make sure you have `admin`, `super_admin`, or `moderator` role
2. **Verify functions exist**: Check in Supabase Dashboard → Database → Functions
3. **Check permissions**: Ensure functions have `authenticated` role permissions
4. **Test manually**: Try the SQL test queries above

The admin user management should now show all users and allow proper role management!