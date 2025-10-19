import React from 'react';

export default function UltraSimpleTest() {
  console.log('🚀 UltraSimpleTest component loaded');
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'lightblue' }}>
      <h1>Ultra Simple Test</h1>
      <p>If you can see this, React is working!</p>
      <p>Current time: {new Date().toISOString()}</p>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'white' }}>
        <h2>Browser Info:</h2>
        <p>User Agent: {navigator.userAgent}</p>
        <p>URL: {window.location.href}</p>
      </div>
    </div>
  );
}