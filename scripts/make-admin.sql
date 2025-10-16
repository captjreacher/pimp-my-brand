-- MAKE USER ADMIN SCRIPT
-- Run this AFTER you have signed up with mike@mikerobinson.co.nz

-- First, let's check what columns exist in the profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Update your user to have super admin privileges
UPDATE public.profiles 
SET app_role = 'super_admin'
WHERE id = 'bdc1eedc-87e5-43ae-9304-16e673986696';

-- Verify the update worked
SELECT 
    id,
    app_role,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = 'bdc1eedc-87e5-43ae-9304-16e673986696';

-- Success message
SELECT 'Mike Robinson is now a super admin!' as status;