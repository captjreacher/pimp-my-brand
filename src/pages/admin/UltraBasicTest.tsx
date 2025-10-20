import React from 'react';

/**
 * Ultra Basic Test - Absolute minimal React component
 * If this doesn't work, there's a fundamental routing issue
 */
export default function UltraBasicTest() {
  console.log('UltraBasicTest: Component is rendering');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        🎉 ADMIN ROUTING WORKS!
      </h1>
      
      <div style={{ 
        backgroundColor: '#4CAF50', 
        color: 'white', 
        padding: '15px', 
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <strong>SUCCESS:</strong> If you can see this page, the admin routing is working correctly.
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Debug Information:</h2>
        <ul>
          <li>✅ React component rendered</li>
          <li>✅ Admin route accessible</li>
          <li>✅ No authentication blocking</li>
          <li>✅ Router configuration working</li>
        </ul>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Current URL:</h2>
        <code style={{ 
          backgroundColor: '#e0e0e0', 
          padding: '5px', 
          borderRadius: '3px' 
        }}>
          {window.location.href}
        </code>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Test Other Admin Routes:</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.location.href = '/admin/simple'}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#2196F3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Simple Admin
          </button>
          <button 
            onClick={() => window.location.href = '/admin/fallback'}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#FF9800', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Fallback Admin
          </button>
          <button 
            onClick={() => window.location.href = '/admin/test'}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#9C27B0', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Admin Test
          </button>
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        padding: '15px', 
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        <strong>Next Steps:</strong>
        <p>Since this basic page is working, we can now debug why the complex admin dashboard isn't loading. The routing itself is fine.</p>
      </div>
    </div>
  );
}