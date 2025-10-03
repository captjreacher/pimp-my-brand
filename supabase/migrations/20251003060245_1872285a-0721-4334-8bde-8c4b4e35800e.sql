-- Fix security issue: Remove public access to shares table
-- and create a secure function to validate specific share tokens

-- Drop the insecure public SELECT policy
DROP POLICY IF EXISTS "Anyone can view valid shares" ON public.shares;

-- Create a security definer function to validate and retrieve a specific share by token
CREATE OR REPLACE FUNCTION public.get_share_by_token(_token text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  target_id uuid,
  kind text,
  token text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    user_id,
    target_id,
    kind,
    token,
    expires_at,
    created_at
  FROM public.shares
  WHERE token = _token
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_share_by_token(text) TO authenticated, anon;

-- Add a comment explaining the security model
COMMENT ON FUNCTION public.get_share_by_token IS 'Securely validates and retrieves a share by its token. Only returns non-expired shares. Use this function instead of direct SELECT queries to prevent token enumeration attacks.';