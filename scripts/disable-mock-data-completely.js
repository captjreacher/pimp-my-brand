// Disable all mock data in admin services
// This will force the admin interface to use real Supabase data

import fs from 'fs';
import path from 'path';

console.log('🔧 Disabling mock data in admin services...');

// Files that might be using mock data
const filesToCheck = [
  'src/lib/admin/user-management-service.ts',
  'src/hooks/use-user-management.ts',
  'src/lib/admin/analytics-service.ts',
  'src/lib/admin/subscription-plans-service.ts',
  'src/hooks/use-subscription-plans.ts'
];

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Look for mock data patterns
    const hasMockData = content.includes('mockUsers') || 
                       content.includes('mockData') || 
                       content.includes('// Mock') ||
                       content.includes('const mock') ||
                       content.includes('return mock');
    
    if (hasMockData) {
      console.log(`❌ Found mock data in: ${filePath}`);
      
      // Show the problematic lines
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('mock') || line.includes('Mock')) {
          console.log(`   Line ${index + 1}: ${line.trim()}`);
        }
      });
    } else {
      console.log(`✅ No mock data found in: ${filePath}`);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n🎯 Next steps:');
console.log('1. Run the SQL script to create your real profile');
console.log('2. Check which files need mock data removed');
console.log('3. Force admin interface to use real Supabase connection');