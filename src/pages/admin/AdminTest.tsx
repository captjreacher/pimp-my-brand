import React from 'react';
import { useAdmin } from '@/contexts/AdminContext';

/**
 * Simple Admin Test Component
 * Used to debug admin routing and loading issues
 */
export default function AdminTest() {
  const { user, isLoading, error } = useAdmin();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Test Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Admin Context Status</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
            <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'None'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Navigation Test</h2>
          <div className="space-y-2">
            <a href="/admin" className="block text-blue-600 hover:underline">Go to /admin</a>
            <a href="/admin/" className="block text-blue-600 hover:underline">Go to /admin/</a>
            <button 
              onClick={() => window.location.href = '/admin'}
              className="block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Navigate to Admin (window.location)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}