import React from 'react';
import UnifiedAdminDashboard from './UnifiedAdminDashboard';

/**
 * Direct Admin Test - Bypasses authentication for testing
 * Use this to test if the admin dashboard renders without auth issues
 */
export default function DirectAdminTest() {
  console.log('DirectAdminTest: Rendering...');
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <strong>Direct Admin Test Mode</strong> - Authentication bypassed for testing
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Admin Dashboard Test</h1>
          <p className="text-gray-600 mb-6">
            This page tests the admin dashboard without authentication checks.
          </p>
          
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Unified Admin Dashboard:</h2>
            <div className="border rounded-lg p-4 bg-gray-50">
              <UnifiedAdminDashboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}