// Offline Admin Mode - automatically enabled when Supabase credentials are missing

const flagEnabled = (value?: string) => value?.toLowerCase() === 'true';

const hasSupabaseCredentials = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const forceOffline = flagEnabled(import.meta.env.VITE_FORCE_OFFLINE_ADMIN);
const disableOffline = flagEnabled(import.meta.env.VITE_DISABLE_OFFLINE_ADMIN);

const shouldUseOffline = forceOffline || (
  !disableOffline &&
  import.meta.env.DEV &&
  !hasSupabaseCredentials
);

export const OFFLINE_ADMIN_MODE = shouldUseOffline;

export const offlineAdminUser = {
  id: 'offline-admin-123',
  email: 'admin@offline.com',
  app_role: 'super_admin' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const offlineAuthState = {
  user: {
    id: 'offline-admin-123',
    email: 'admin@offline.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  session: {
    access_token: 'offline-token',
    refresh_token: 'offline-refresh',
    expires_in: 3600,
    token_type: 'bearer'
  }
};