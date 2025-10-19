-- Check if subscription_plans table exists and has data
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_plans'
    ) THEN
        RAISE NOTICE '✅ subscription_plans table exists';
        
        -- Check table structure
        RAISE NOTICE '📋 Table columns:';
        FOR rec IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'subscription_plans' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '   - %: % (%)', rec.column_name, rec.data_type, 
                CASE WHEN rec.is_nullable = 'YES' THEN 'nullable' ELSE 'not null' END;
        END LOOP;
        
        -- Check if there are any plans
        DECLARE
            plan_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO plan_count FROM public.subscription_plans;
            RAISE NOTICE '📊 Total plans in table: %', plan_count;
            
            IF plan_count > 0 THEN
                RAISE NOTICE '📋 Existing plans:';
                FOR rec IN 
                    SELECT name, tier, price_monthly, is_active 
                    FROM public.subscription_plans 
                    ORDER BY price_monthly
                LOOP
                    RAISE NOTICE '   - %: % ($/month: %, active: %)', 
                        rec.name, rec.tier, rec.price_monthly, rec.is_active;
                END LOOP;
            ELSE
                RAISE NOTICE '⚠️ No plans found - need to insert default plans';
            END IF;
        END;
        
    ELSE
        RAISE NOTICE '❌ subscription_plans table does NOT exist';
        RAISE NOTICE '🔧 Need to run migration: 20251019000001_create_subscription_plans_table.sql';
    END IF;
    
    -- Check RLS policies
    IF EXISTS (
        SELECT FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'subscription_plans'
    ) THEN
        RAISE NOTICE '🔐 RLS policies exist for subscription_plans';
        FOR rec IN 
            SELECT policyname, cmd, roles
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'subscription_plans'
        LOOP
            RAISE NOTICE '   - Policy: % (%) for roles: %', rec.policyname, rec.cmd, rec.roles;
        END LOOP;
    ELSE
        RAISE NOTICE '⚠️ No RLS policies found for subscription_plans';
    END IF;
    
    -- Check if current user has admin permissions
    DECLARE
        current_user_id UUID;
        user_permissions TEXT[];
        has_billing_perm BOOLEAN := FALSE;
    BEGIN
        SELECT auth.uid() INTO current_user_id;
        
        IF current_user_id IS NOT NULL THEN
            SELECT admin_permissions INTO user_permissions 
            FROM public.profiles 
            WHERE id = current_user_id;
            
            IF user_permissions IS NOT NULL THEN
                has_billing_perm := 'manage_billing' = ANY(user_permissions);
                RAISE NOTICE '👤 Current user permissions: %', user_permissions;
                RAISE NOTICE '💳 Has manage_billing permission: %', has_billing_perm;
            ELSE
                RAISE NOTICE '⚠️ Current user has no admin permissions';
            END IF;
        ELSE
            RAISE NOTICE '❌ No authenticated user found';
        END IF;
    END;
    
END $$;