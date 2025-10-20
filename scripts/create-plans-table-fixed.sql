-- Create subscription_plans table (simple version)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    interval TEXT NOT NULL DEFAULT 'month',
    features TEXT[] DEFAULT '{}',
    stripe_price_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow public read access to active subscription plans" ON public.subscription_plans;
CREATE POLICY "Allow public read access to active subscription plans" 
ON public.subscription_plans FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Allow admin full access to subscription plans" ON public.subscription_plans;
CREATE POLICY "Allow admin full access to subscription plans" 
ON public.subscription_plans FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND app_role IN ('admin', 'super_admin')
    )
);

-- Insert default plans
INSERT INTO public.subscription_plans (name, price, interval, features, stripe_price_id, is_active)
VALUES
    ('Free Plan', 0.00, 'month', ARRAY['Basic features', '5 generations per month', 'Standard templates'], 'price_free', true),
    ('Pro Plan', 9.99, 'month', ARRAY['All features', 'Unlimited generations', 'Premium templates', 'Priority support'], 'price_pro_monthly', true),
    ('Business Plan', 29.99, 'month', ARRAY['All Pro features', 'Team collaboration', 'Custom branding', 'API access'], 'price_business_monthly', true)
ON CONFLICT DO NOTHING;

-- Show results
SELECT 'Table created successfully!' as status;
SELECT COUNT(*) as total_plans FROM public.subscription_plans;