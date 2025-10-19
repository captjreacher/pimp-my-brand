-- Check the app_role type definition and fix the query
-- First, let's see what the user-defined type is

-- Check what types exist
SELECT typname, typtype, typowner 
FROM pg_type 
WHERE typname LIKE '%role%' OR typname LIKE '%app%';

-- Check the profiles table structure
SELECT 
  column_name, 
  data_type, 
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Try to see the enum values if it's an enum
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%role%'
ORDER BY e.enumsortorder;

-- Now let's try to query profiles with proper casting
SELECT 
  'Profiles with proper app_role casting:' as info,
  id,
  email,
  app_role::text as app_role_text,
  created_at
FROM profiles 
WHERE id = auth.uid();

-- Also check all profiles to see the data
SELECT 
  'All profiles:' as info,
  id,
  email,
  app_role::text as app_role_text,
  created_at
FROM profiles 
LIMIT 10;