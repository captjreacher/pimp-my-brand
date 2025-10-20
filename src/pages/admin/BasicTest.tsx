import React from 'react';

/**
 * Basic Test - Simple HTML-only admin test
 */
export default function BasicTest() {
  return (
    <div>
      <h1>Basic Admin Test</h1>
      <p>This is a basic admin test page.</p>
      <p>Current URL: {window.location.href}</p>
      <p>Timestamp: {new Date().toLocaleString()}</p>
    </div>
  );
}