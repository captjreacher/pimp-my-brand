import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function DebugUserManagement() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDebug = async () => {
      try {
        console.log('🔍 Starting debug...');
        
        // Check auth status
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('Auth user:', user);
        console.log('Auth error:', authError);

        // Try direct profiles query
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, app_role, created_at')
          .limit(5);
        
        console.log('Profiles data:', profiles);
        console.log('Profiles error:', profilesError);

        // Try with current user
        const { data: currentProfile, error: currentError } = await supabase
          .from('profiles')
          .select('id, email, app_role, created_at')
          .eq('id', user?.id)
          .single();
        
        console.log('Current profile:', currentProfile);
        console.log('Current error:', currentError);

        setDebugInfo({
          user,
          authError,
          profiles,
          profilesError,
          currentProfile,
          currentError,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Debug error:', error);
        setDebugInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    runDebug();
  }, []);

  if (loading) {
    return <div className="p-4">Loading debug info...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Management Debug</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Auth Status:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              user: debugInfo.user ? {
                id: debugInfo.user.id,
                email: debugInfo.user.email
              } : null,
              authError: debugInfo.authError
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Current Profile:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              currentProfile: debugInfo.currentProfile,
              currentError: debugInfo.currentError
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">All Profiles (first 5):</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              profiles: debugInfo.profiles,
              profilesError: debugInfo.profilesError
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Full Debug Info:</h2>
          <pre className="text-sm overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}