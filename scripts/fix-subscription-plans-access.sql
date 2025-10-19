-- First, check current user and their role
SELECT 
  auth.uid() as user_id,
  p.email,
  p.app_role,
  p.created_at
FROM profiles p 
WHERE p.id = auth.uid();

-- Check if subscription_plans table exists and has RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'subscription_plans';

-- Check current RLS policies on subscription_plans
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'subscription_plans';

-- Temporarily disable RLS on subscription_plans for testing
ALTER TABLE public.subscription_plans DISABLE ROW LEVEL SECURITY;

-- Or create a more permissive policy for authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to read subscription plans" ON public.subscription_plans;
CREATE POLICY "Allow authenticated users to read subscription plans"
  ON public.subscription_plans
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to manage plans (for admin testing)
DROP POLICY IF EXISTS "Allow authenticated users to manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Allow authenticated users to manage subscription plans"
  ON public.subscription_plans
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Test access to subscription_plans
SELECT COUNT(*) as plan_count FROM public.subscription_plans;
SELECT * FROM public.subscription_plans LIMIT 3;