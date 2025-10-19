import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function TestPlansAccess() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const runTest = async (testName: string, query: () => Promise<any>) => {
    try {
      setLoading(true);
      const result = await query();
      setResults(prev => [...prev, {
        test: testName,
        success: true,
        data: result.data,
        error: result.error,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        test: testName,
        success: false,
        error: error,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const testDirectAccess = () => {
    runTest('Direct Table Access', () => 
      supabase.from('subscription_plans').select('*')
    );
  };

  const testCount = () => {
    runTest('Count Plans', () => 
      supabase.from('subscription_plans').select('*', { count: 'exact', head: true })
    );
  };

  const testRawSQL = () => {
    runTest('Raw SQL Query', () => 
      supabase.rpc('exec_sql', { 
        sql: 'SELECT COUNT(*) as count FROM public.subscription_plans' 
      })
    );
  };

  const testUserProfile = () => {
    runTest('User Profile', () => 
      supabase.from('profiles').select('*').eq('id', user?.id).single()
    );
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Subscription Plans Access</h1>
          <p className="text-muted-foreground">
            Debug subscription plans table access and permissions
          </p>
        </div>
        <Button onClick={clearResults} variant="outline">
          Clear Results
        </Button>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Authenticated:</strong> ✅</p>
            </div>
          ) : (
            <p className="text-red-600">❌ Not authenticated</p>
          )}
        </CardContent>
      </Card>

      {/* Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Run Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={testDirectAccess} 
              disabled={loading}
              className="w-full"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Direct Access
            </Button>
            
            <Button 
              onClick={testCount} 
              disabled={loading}
              className="w-full"
            >
              Test Count Query
            </Button>
            
            <Button 
              onClick={testUserProfile} 
              disabled={loading}
              className="w-full"
            >
              Test User Profile
            </Button>
            
            <Button 
              onClick={testRawSQL} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              Test Raw SQL
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                {result.test}
                <span className="text-sm text-muted-foreground ml-auto">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">✅ Success</p>
                  {result.data && (
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-600 font-medium">❌ Failed</p>
                  <pre className="bg-red-50 p-3 rounded text-sm overflow-auto text-red-800">
                    {JSON.stringify(result.error, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {results.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No test results yet. Run a test above to see results.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}