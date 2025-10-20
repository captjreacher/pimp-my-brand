-- Quick fix for Plans tab permissions
-- Run this if the diagnostic shows permission issues

-- First, let's check and fix your user permissions
DO $$
DECLARE
    current_user_id UUID;
    user_email TEXT;
    current_permissions TEXT[];
BEGIN
    -- Get current user
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NOT NULL THEN
        -- Get user email and current permissions
        SELECT email, admin_permissions 
        INTO user_email, current_permissions
        FROM public.profiles 
        WHERE id = current_user_id;
        
        RAISE NOTICE '👤 Fixing permissions for user: % (%)', user_email, current_user_id;
        
        -- Add manage_billing permission if not present
        IF current_permissions IS NULL OR NOT ('manage_billing' = ANY(current_permissions)) THEN
            UPDATE public.profiles 
            SET admin_permissions = COALESCE(admin_permissions, '{}') || '{manage_billing}'
            WHERE id = current_user_id;
            
            RAISE NOTICE '✅ Added manage_billing permission';
        ELSE
            RAISE NOTICE '✅ User already has manage_billing permission';
        END IF;
        
        -- Ensure user has admin role
        UPDATE public.profiles 
        SET app_role = CASE 
            WHEN app_role IN ('admin', 'super_admin') THEN app_role 
            ELSE 'admin' 
        END
        WHERE id = current_user_id;
        
        RAISE NOTICE '✅ Ensured admin role';
        
        -- Show final permissions
        SELECT admin_permissions INTO current_permissions
        FROM public.profiles 
        WHERE id = current_user_id;
        
        RAISE NOTICE '🔐 Final permissions: %', current_permissions;
        
    ELSE
        RAISE NOTICE '❌ No authenticated user found - please log in first';
    END IF;
END $$;

-- Also ensure the subscription_plans table exists with some data
DO $$
BEGIN
    -- Check if table exists and has data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
        IF NOT EXISTS (SELECT 1 FROM public.subscription_plans LIMIT 1) THEN
            -- Insert default plans if table is empty
            INSERT INTO public.subscription_plans (name, description, tier, price_monthly, price_yearly, trial_days, features, limits, is_active, is_popular) VALUES
            (
              'Free Plan',
              'Perfect for getting started with basic features',
              'free',
              0.00,
              0.00,
              7,
              '[{"id": "brand_creation", "name": "Brand Creation", "description": "Create personal brands", "included": true, "limit": 3}]'::jsonb,
              '{"brands_per_month": 3, "cvs_per_month": 3, "ai_generations_per_month": 10, "storage_mb": 100}'::jsonb,
              true,
              false
            ),
            (
              'Pro Plan',
              'For professionals who need more power and features',
              'pro',
              19.99,
              199.99,
              14,
              '[{"id": "brand_creation", "name": "Brand Creation", "description": "Create personal brands", "included": true, "limit": 20}]'::jsonb,
              '{"brands_per_month": 20, "cvs_per_month": 20, "ai_generations_per_month": 100, "storage_mb": 1000}'::jsonb,
              true,
              true
            );
            
            RAISE NOTICE '✅ Added default subscription plans';
        ELSE
            RAISE NOTICE '✅ Subscription plans already exist';
        END IF;
    ELSE
        RAISE NOTICE '❌ subscription_plans table does not exist - run create-subscription-plans-fixed.sql first';
    END IF;
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PLANS TAB FIX COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '1. Hard refresh your browser (Ctrl+F5)';
    RAISE NOTICE '2. Go to /admin/subscriptions';
    RAISE NOTICE '3. You should now see the Plans tab!';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 If still not working, run the diagnostic script:';
    RAISE NOTICE '   scripts/diagnose-plans-tab-issue.sql';
END $$;