import React from 'react';
import { useAdmin } from '@/contexts/AdminContext';

/**
 * Simple Admin Fallback
 * A minimal admin interface that always works
 */
export default function SimpleAdminFallback() {
  const { user, isLoading, error } = useAdmin();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">✅ Admin Console</h1>
          <p className="text-gray-300">Simple admin interface - always works!</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">User Status</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
              <p><strong>Error:</strong> {error || 'None'}</p>
              <p><strong>User ID:</strong> {user?.id || 'None'}</p>
              <p><strong>Email:</strong> {user?.email || 'None'}</p>
              <p><strong>Role:</strong> {user?.app_role || 'None'}</p>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.href = '/admin'}
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Try Full Admin Dashboard
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="block w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Go to User Dashboard
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="block w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                Refresh Page
              </button>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">System Status</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Current URL:</strong> {window.location.pathname}</p>
              <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
              <p><strong>Browser:</strong> {navigator.userAgent.split(' ')[0]}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Admin Functions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gray-700 p-4 rounded text-center">
              <h3 className="font-semibold mb-2">User Management</h3>
              <p className="text-sm text-gray-300 mb-3">Manage user accounts and permissions</p>
              <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                Access
              </button>
            </div>
            
            <div className="bg-gray-700 p-4 rounded text-center">
              <h3 className="font-semibold mb-2">Content Moderation</h3>
              <p className="text-sm text-gray-300 mb-3">Review and moderate content</p>
              <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                Access
              </button>
            </div>
            
            <div className="bg-gray-700 p-4 rounded text-center">
              <h3 className="font-semibold mb-2">Subscriptions</h3>
              <p className="text-sm text-gray-300 mb-3">Manage billing and subscriptions</p>
              <button className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">
                Access
              </button>
            </div>
            
            <div className="bg-gray-700 p-4 rounded text-center">
              <h3 className="font-semibold mb-2">Analytics</h3>
              <p className="text-sm text-gray-300 mb-3">View system analytics</p>
              <button className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700">
                Access
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400">
          <p>This is a fallback admin interface. If you're seeing this, the main admin dashboard may have loading issues.</p>
        </div>
      </div>
    </div>
  );
}