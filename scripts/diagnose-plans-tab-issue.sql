-- Diagnostic script to check why Plans tab is not showing
-- Run this in Supabase SQL Editor to diagnose the issue

DO $$
DECLARE
    table_exists BOOLEAN := FALSE;
    user_permissions TEXT[];
    current_user_id UUID;
    plan_count INTEGER := 0;
BEGIN
    -- Check if subscription_plans table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_plans'
    ) INTO table_exists;
    
    RAISE NOTICE '=== PLANS TAB DIAGNOSTIC REPORT ===';
    RAISE NOTICE '';
    
    IF table_exists THEN
        RAISE NOTICE '✅ subscription_plans table EXISTS';
        
        -- Check if there are any plans
        SELECT COUNT(*) INTO plan_count FROM public.subscription_plans;
        RAISE NOTICE '📊 Plans in table: %', plan_count;
        
        IF plan_count > 0 THEN
            RAISE NOTICE '📋 Existing plans:';
            FOR rec IN 
                SELECT name, tier, price_monthly, is_active 
                FROM public.subscription_plans 
                ORDER BY price_monthly
            LOOP
                RAISE NOTICE '   - %: % ($%/month, active: %)', 
                    rec.name, rec.tier, rec.price_monthly, rec.is_active;
            END LOOP;
        ELSE
            RAISE NOTICE '⚠️  No plans found in table';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ subscription_plans table does NOT exist';
        RAISE NOTICE '🔧 SOLUTION: Run the SQL script to create the table';
    END IF;
    
    RAISE NOTICE '';
    
    -- Check current user permissions
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NOT NULL THEN
        RAISE NOTICE '👤 Current user ID: %', current_user_id;
        
        SELECT admin_permissions INTO user_permissions 
        FROM public.profiles 
        WHERE id = current_user_id;
        
        IF user_permissions IS NOT NULL THEN
            RAISE NOTICE '🔐 User permissions: %', user_permissions;
            
            IF 'manage_billing' = ANY(user_permissions) THEN
                RAISE NOTICE '✅ User HAS manage_billing permission';
            ELSE
                RAISE NOTICE '❌ User does NOT have manage_billing permission';
                RAISE NOTICE '🔧 SOLUTION: Add manage_billing to admin_permissions array';
            END IF;
        ELSE
            RAISE NOTICE '⚠️  User has no admin permissions set';
            RAISE NOTICE '🔧 SOLUTION: Set admin_permissions array with manage_billing';
        END IF;
    ELSE
        RAISE NOTICE '❌ No authenticated user found';
        RAISE NOTICE '🔧 SOLUTION: Make sure you are logged in';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== TROUBLESHOOTING STEPS ===';
    RAISE NOTICE '';
    
    IF NOT table_exists THEN
        RAISE NOTICE '1. 🗄️  CREATE TABLE: Run scripts/create-subscription-plans-fixed.sql';
    END IF;
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE '2. 🔑 LOGIN: Make sure you are logged in to the admin panel';
    ELSIF user_permissions IS NULL OR NOT ('manage_billing' = ANY(user_permissions)) THEN
        RAISE NOTICE '2. 🔐 PERMISSIONS: Add manage_billing permission to your user';
        RAISE NOTICE '   Run: UPDATE profiles SET admin_permissions = admin_permissions || ''{manage_billing}'' WHERE id = ''%'';', current_user_id;
    END IF;
    
    RAISE NOTICE '3. 🔄 REFRESH: Hard refresh browser (Ctrl+F5)';
    RAISE NOTICE '4. 🌐 CHECK URL: Make sure you are on /admin/subscriptions';
    RAISE NOTICE '5. 🔍 CONSOLE: Check browser console for JavaScript errors';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== EXPECTED RESULT ===';
    RAISE NOTICE 'You should see tabs: Overview | Plans | Subscriptions | Billing Issues';
    
END $$;