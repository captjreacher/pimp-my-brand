-- Check what columns exist in subscription_plans table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscription_plans' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any existing records
SELECT COUNT(*) as existing_records FROM public.subscription_plans;

-- Show existing data structure
SELECT * FROM public.subscription_plans LIMIT 3;

-- If you need to add more plans, use this corrected INSERT format:
-- The table has price_monthly and price_yearly columns, not just price
/*
INSERT INTO public.subscription_plans (
  name, 
  description, 
  tier, 
  price_monthly, 
  price_yearly, 
  trial_days, 
  features, 
  limits, 
  is_active, 
  is_popular
) VALUES (
  'Enterprise Plan',
  'For large organizations with custom needs',
  'enterprise',
  99.99,
  999.99,
  30,
  '[
    {"id": "brand_creation", "name": "Brand Creation", "description": "Unlimited personal brands", "included": true},
    {"id": "cv_generation", "name": "CV Generation", "description": "Unlimited professional CVs", "included": true},
    {"id": "ai_assistance", "name": "AI Assistance", "description": "Unlimited AI-powered content generation", "included": true},
    {"id": "templates", "name": "All Templates", "description": "Access to all templates including custom", "included": true},
    {"id": "analytics", "name": "Enterprise Analytics", "description": "Full analytics suite with custom reports", "included": true},
    {"id": "api_access", "name": "Full API Access", "description": "Complete programmatic access", "included": true},
    {"id": "priority_support", "name": "Dedicated Support", "description": "Dedicated account manager and support", "included": true},
    {"id": "custom_branding", "name": "White Label", "description": "Complete white label solution", "included": true}
  ]'::jsonb,
  '{
    "brands_per_month": -1,
    "cvs_per_month": -1,
    "ai_generations_per_month": -1,
    "storage_mb": -1,
    "team_members": -1,
    "api_calls_per_month": -1,
    "priority_support": true,
    "custom_branding": true,
    "white_label": true
  }'::jsonb,
  true,
  false
);
*/