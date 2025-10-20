-- STEP 2: Add manage_billing permission to your user
-- Run this after checking permissions

UPDATE public.profiles 
SET admin_permissions = COALESCE(admin_permissions, '{}') || '{manage_billing}'
WHERE id = auth.uid();

-- Verify it worked
SELECT 
    'SUCCESS: Updated permissions to: ' || admin_permissions::text as result
FROM public.profiles 
WHERE id = auth.uid();