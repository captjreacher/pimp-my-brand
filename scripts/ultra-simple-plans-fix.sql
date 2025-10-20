-- ULTRA SIMPLE PLANS TAB FIX
-- Copy and paste this entire script into Supabase SQL Editor

-- Step 1: Create the function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 2: Create the table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  trial_days INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 3: Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies (drop first if they exist)
DROP POLICY IF EXISTS "Admin can manage subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Public can view active subscription plans" ON public.subscription_plans;

CREATE POLICY "Admin can manage subscription plans"
  ON public.subscription_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.app_role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Public can view active subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Step 5: Add trigger
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 6: Add default plans (only if table is empty)
INSERT INTO public.subscription_plans (name, description, tier, price_monthly, price_yearly, trial_days, features, limits, is_active, is_popular) 
SELECT 'Free Plan', 'Perfect for getting started', 'free', 0.00, 0.00, 7, '[]'::jsonb, '{}'::jsonb, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE tier = 'free');

INSERT INTO public.subscription_plans (name, description, tier, price_monthly, price_yearly, trial_days, features, limits, is_active, is_popular) 
SELECT 'Pro Plan', 'For professionals', 'pro', 19.99, 199.99, 14, '[]'::jsonb, '{}'::jsonb, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE tier = 'pro');

-- Step 7: Fix current user permissions
UPDATE public.profiles 
SET admin_permissions = COALESCE(admin_permissions, '{}') || '{manage_billing}'
WHERE id = auth.uid() 
AND (admin_permissions IS NULL OR NOT ('manage_billing' = ANY(admin_permissions)));

-- Step 8: Ensure user has admin role
UPDATE public.profiles 
SET app_role = CASE 
    WHEN app_role IN ('admin', 'super_admin') THEN app_role 
    ELSE 'admin' 
END
WHERE id = auth.uid();

-- Step 9: Grant permissions
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;

-- Success message
SELECT '🎯 PLANS TAB FIX COMPLETE! Refresh your browser and go to /admin/subscriptions' as result;