// Offline Admin Mode - for testing without Supabase connection
export const OFFLINE_ADMIN_MODE = false; // Set to false when Supabase is working

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