-- Simple subscription plans table creation (without triggers)
-- Run this if the main migration fails

-- Create update function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'premium', 'enterprise')),
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  trial_days INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
DROP POLICY IF EXISTS "Admin can manage subscription plans" ON public.subscription_plans;
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

-- Create policy for public read access to active plans
DROP POLICY IF EXISTS "Public can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Public can view active subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_tier ON public.subscription_plans(tier);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_popular ON public.subscription_plans(is_popular);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_created_at ON public.subscription_plans(created_at);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans (only if table is empty)
INSERT INTO public.subscription_plans (name, description, tier, price_monthly, price_yearly, trial_days, features, limits, is_active, is_popular) 
SELECT * FROM (VALUES
(
  'Free Plan',
  'Perfect for getting started with basic features',
  'free',
  0.00,
  0.00,
  7,
  '[
    {"id": "brand_creation", "name": "Brand Creation", "description": "Create personal brands", "included": true, "limit": 3},
    {"id": "cv_generation", "name": "CV Generation", "description": "Generate professional CVs", "included": true, "limit": 3},
    {"id": "ai_assistance", "name": "AI Assistance", "description": "AI-powered content generation", "included": true, "limit": 10},
    {"id": "templates", "name": "Basic Templates", "description": "Access to basic templates", "included": true},
    {"id": "analytics", "name": "Analytics Dashboard", "description": "Basic usage analytics", "included": false},
    {"id": "api_access", "name": "API Access", "description": "Programmatic access to features", "included": false},
    {"id": "priority_support", "name": "Priority Support", "description": "24/7 priority customer support", "included": false},
    {"id": "custom_branding", "name": "Custom Branding", "description": "Remove branding and add your own", "included": false}
  ]'::jsonb,
  '{
    "brands_per_month": 3,
    "cvs_per_month": 3,
    "ai_generations_per_month": 10,
    "storage_mb": 100,
    "team_members": 1,
    "api_calls_per_month": 100,
    "priority_support": false,
    "custom_branding": false
  }'::jsonb,
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
  '[
    {"id": "brand_creation", "name": "Brand Creation", "description": "Create personal brands", "included": true, "limit": 20},
    {"id": "cv_generation", "name": "CV Generation", "description": "Generate professional CVs", "included": true, "limit": 20},
    {"id": "ai_assistance", "name": "AI Assistance", "description": "AI-powered content generation", "included": true, "limit": 100},
    {"id": "templates", "name": "Premium Templates", "description": "Access to all premium templates", "included": true},
    {"id": "analytics", "name": "Analytics Dashboard", "description": "Detailed usage analytics", "included": true},
    {"id": "api_access", "name": "API Access", "description": "Programmatic access to features", "included": true, "limit": 1000},
    {"id": "priority_support", "name": "Priority Support", "description": "Priority customer support", "included": true},
    {"id": "custom_branding", "name": "Custom Branding", "description": "Remove branding and add your own", "included": false}
  ]'::jsonb,
  '{
    "brands_per_month": 20,
    "cvs_per_month": 20,
    "ai_generations_per_month": 100,
    "storage_mb": 1000,
    "team_members": 3,
    "api_calls_per_month": 1000,
    "priority_support": true,
    "custom_branding": false
  }'::jsonb,
  true,
  true
),
(
  'Premium Plan',
  'For teams and power users who need unlimited access',
  'premium',
  49.99,
  499.99,
  30,
  '[
    {"id": "brand_creation", "name": "Brand Creation", "description": "Create unlimited personal brands", "included": true},
    {"id": "cv_generation", "name": "CV Generation", "description": "Generate unlimited professional CVs", "included": true},
    {"id": "ai_assistance", "name": "AI Assistance", "description": "Unlimited AI-powered content generation", "included": true},
    {"id": "templates", "name": "Premium Templates", "description": "Access to all premium templates", "included": true},
    {"id": "analytics", "name": "Advanced Analytics", "description": "Advanced usage analytics and insights", "included": true},
    {"id": "api_access", "name": "API Access", "description": "Full programmatic access to features", "included": true},
    {"id": "priority_support", "name": "Priority Support", "description": "24/7 priority customer support", "included": true},
    {"id": "custom_branding", "name": "Custom Branding", "description": "Remove branding and add your own", "included": true}
  ]'::jsonb,
  '{
    "brands_per_month": -1,
    "cvs_per_month": -1,
    "ai_generations_per_month": -1,
    "storage_mb": 10000,
    "team_members": 10,
    "api_calls_per_month": -1,
    "priority_support": true,
    "custom_branding": true
  }'::jsonb,
  true,
  false
)
) AS v(name, description, tier, price_monthly, price_yearly, trial_days, features, limits, is_active, is_popular)
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans LIMIT 1);

-- Create helper functions
CREATE OR REPLACE FUNCTION public.get_subscription_plan_by_tier(tier_param TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  tier TEXT,
  price_monthly DECIMAL,
  price_yearly DECIMAL,
  trial_days INTEGER,
  features JSONB,
  limits JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sp.id,
    sp.name,
    sp.description,
    sp.tier,
    sp.price_monthly,
    sp.price_yearly,
    sp.trial_days,
    sp.features,
    sp.limits
  FROM public.subscription_plans sp
  WHERE sp.tier = tier_param 
    AND sp.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_active_subscription_plans()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  tier TEXT,
  price_monthly DECIMAL,
  price_yearly DECIMAL,
  trial_days INTEGER,
  features JSONB,
  limits JSONB,
  is_popular BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sp.id,
    sp.name,
    sp.description,
    sp.tier,
    sp.price_monthly,
    sp.price_yearly,
    sp.trial_days,
    sp.features,
    sp.limits,
    sp.is_popular
  FROM public.subscription_plans sp
  WHERE sp.is_active = true
  ORDER BY sp.price_monthly ASC;
$$;

-- Grant permissions
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Subscription plans table created successfully!';
    RAISE NOTICE '📋 Default plans added: Free, Pro, Premium';
    RAISE NOTICE '🎯 Plans tab should now be visible in admin panel';
END $$;