import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDebug() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        setUser(user);
        
        if (user) {
          // Get profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (profileError) throw profileError;
          setProfile(profile);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, []);

  if (loading) return <div>Loading admin debug info...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Admin Debug Information</h1>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Auth User:</h2>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Profile:</h2>
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      </div>
      
      <div>
        <h2>Admin Status:</h2>
        <p>Is Admin: {profile?.app_role === 'super_admin' ? 'YES' : 'NO'}</p>
        <p>Role: {profile?.app_role || 'None'}</p>
        <p>Permissions: {profile?.admin_permissions?.join(', ') || 'None'}</p>
        
        <h3>Debug Info:</h3>
        <p>Profile has app_role field: {profile?.hasOwnProperty('app_role') ? 'YES' : 'NO'}</p>
        <p>Profile app_role value: {JSON.stringify(profile?.app_role)}</p>
        <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL}</p>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <a href="/admin" style={{ color: 'blue' }}>Try Admin Dashboard</a>
      </div>
    </div>
  );
}