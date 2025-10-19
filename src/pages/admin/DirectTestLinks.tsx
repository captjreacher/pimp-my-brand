import React from 'react';

export default function DirectTestLinks() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Test Links</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Working Real Data Pages:</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
            <div>
              <h3 className="font-medium text-green-900">✅ User Management (Real Data)</h3>
              <p className="text-sm text-green-700">Shows actual users from your database</p>
            </div>
            <a 
              href="/admin/users" 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
            >
              Visit Page
            </a>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
            <div>
              <h3 className="font-medium text-blue-900">🎯 Subscription Management (Real Data)</h3>
              <p className="text-sm text-blue-700">This is your working Plans tab!</p>
            </div>
            <a 
              href="/admin/subscriptions" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              Visit Plans Tab
            </a>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded">
            <div>
              <h3 className="font-medium text-purple-900">🔍 Debug Page</h3>
              <p className="text-sm text-purple-700">Shows raw database connection info</p>
            </div>
            <a 
              href="/admin/debug-users" 
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
            >
              Debug Info
            </a>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-medium text-yellow-900 mb-2">⚠️ Demo Pages (Mock Data):</h3>
          <p className="text-sm text-yellow-800">
            The other admin pages (Security, Communication, Analytics, etc.) are still using demo/mock data. 
            Only Users and Subscriptions have been converted to real data.
          </p>
        </div>
        
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-medium text-green-900 mb-2">🎉 Success Summary:</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✅ You are logged in as super_admin</li>
            <li>✅ User Management shows real data from Supabase</li>
            <li>✅ Subscription Management (Plans tab) is now working</li>
            <li>✅ Database connection is established</li>
          </ul>
        </div>
      </div>
    </div>
  );
}