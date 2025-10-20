-- Simple diagnostic for Plans tab issue
-- Run this in Supabase SQL Editor

-- Check if subscription_plans table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'subscription_plans'
        ) 
        THEN '✅ subscription_plans table EXISTS'
        ELSE '❌ subscription_plans table does NOT exist - need to create it'
    END as table_status;

-- Check if there are any plans (only if table exists)
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscription_plans')
        THEN (
            SELECT 
                CASE 
                    WHEN COUNT(*) > 0 
                    THEN '✅ Found ' || COUNT(*) || ' subscription plans'
                    ELSE '⚠️ Table exists but no plans found - need to add default plans'
                END
            FROM public.subscription_plans
        )
        ELSE 'Table does not exist'
    END as plans_status;

-- Check current user permissions
SELECT 
    CASE 
        WHEN auth.uid() IS NULL 
        THEN '❌ No authenticated user - please log in'
        ELSE '✅ User is authenticated: ' || auth.uid()::text
    END as auth_status;

-- Check if user has manage_billing permission
SELECT 
    CASE 
        WHEN auth.uid() IS NULL 
        THEN 'Not authenticated'
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND 'manage_billing' = ANY(admin_permissions)
        )
        THEN '✅ User HAS manage_billing permission'
        ELSE '❌ User does NOT have manage_billing permission - need to add it'
    END as permission_status;

-- Show user's current permissions
SELECT 
    CASE 
        WHEN auth.uid() IS NULL 
        THEN 'Not authenticated'
        ELSE COALESCE(
            (SELECT admin_permissions::text FROM public.profiles WHERE id = auth.uid()),
            'No permissions set'
        )
    END as current_permissions;