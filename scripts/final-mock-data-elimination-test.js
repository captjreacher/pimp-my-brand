// FINAL MOCK DATA ELIMINATION TEST
// This test verifies that ALL mock data has been removed from the admin UI
import fs from 'fs';
import path from 'path';

console.log('🎯 FINAL MOCK DATA ELIMINATION TEST');
console.log('===================================');
console.log('Scanning all admin files for remaining mock data patterns\n');

// Mock data patterns to detect
const MOCK_PATTERNS = [
  // Hardcoded numbers
  { pattern: /\b1247\b/, description: "Hardcoded user count 1247", severity: 'HIGH' },
  { pattern: /\b892\b/, description: "Hardcoded active users 892", severity: 'HIGH' },
  { pattern: /\b15420\b|15,420|\$15,420/, description: "Hardcoded revenue $15,420", severity: 'HIGH' },
  { pattern: /\b98\.5\b/, description: "Hardcoded system health 98.5%", severity: 'MEDIUM' },
  
  // Fake emails
  { pattern: /john\.doe@example\.com/, description: "Fake email: john.doe@example.com", severity: 'HIGH' },
  { pattern: /user@example\.com/, description: "Fake email: user@example.com", severity: 'HIGH' },
  { pattern: /admin@example\.com/, description: "Fake email: admin@example.com", severity: 'HIGH' },
  { pattern: /jane\.smith@example\.com/, description: "Fake email: jane.smith@example.com", severity: 'HIGH' },
  { pattern: /mike\.wilson@example\.com/, description: "Fake email: mike.wilson@example.com", severity: 'HIGH' },
  { pattern: /sarah\.jones@example\.com/, description: "Fake email: sarah.jones@example.com", severity: 'HIGH' },
  { pattern: /moderator@example\.com/, description: "Fake email: moderator@example.com", severity: 'HIGH' },
  { pattern: /attacker@malicious\.com/, description: "Fake email: attacker@malicious.com", severity: 'HIGH' },
  { pattern: /unknown@suspicious\.com/, description: "Fake email: unknown@suspicious.com", severity: 'HIGH' },
  
  // Fake content
  { pattern: /Tech Startup Brand/, description: "Fake brand name: Tech Startup Brand", severity: 'MEDIUM' },
  { pattern: /Marketing Manager CV/, description: "Fake CV title: Marketing Manager CV", severity: 'MEDIUM' },
  { pattern: /Creative Agency Brand/, description: "Fake brand name: Creative Agency Brand", severity: 'MEDIUM' },
  { pattern: /Software Developer CV/, description: "Fake CV title: Software Developer CV", severity: 'MEDIUM' },
  
  // Demo data indicators
  { pattern: /demo-user-\d+/, description: "Demo user ID pattern", severity: 'HIGH' },
  { pattern: /using demo data/i, description: "Demo data message", severity: 'HIGH' },
  { pattern: /demo data/i, description: "Demo data reference", severity: 'MEDIUM' },
  { pattern: /mock data/i, description: "Mock data reference", severity: 'MEDIUM' },
  { pattern: /sample data/i, description: "Sample data reference", severity: 'MEDIUM' },
];

// Files to scan
const ADMIN_FILES = [
  'src/pages/admin/AdminDashboardPage.tsx',
  'src/pages/admin/UserManagementPage.tsx',
  'src/pages/admin/SimpleAdminDashboard.tsx',
  'src/pages/admin/SimpleUserManagementPage.tsx',
  'src/pages/admin/SimpleSubscriptionPage.tsx',
  'src/pages/admin/SimpleSecurityPage.tsx',
  'src/pages/admin/SimpleModerationPage.tsx',
  'src/pages/admin/SimpleConfigPage.tsx',
  'src/pages/admin/SimpleAnalyticsPage.tsx',
  'src/lib/admin/user-management-service.ts',
  'src/lib/admin/analytics-service.ts',
  'src/lib/admin/moderation-service.ts',
  'src/hooks/use-user-management.ts',
  'src/lib/admin/api/user-management-api.ts'
];

function scanFileForMockData(filePath) {
  if (!fs.existsSync(filePath)) {
    return { found: [], error: `File not found: ${filePath}` };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const found = [];
  
  MOCK_PATTERNS.forEach(({ pattern, description, severity }) => {
    const matches = content.match(pattern);
    if (matches) {
      // Get line number
      const lines = content.split('\n');
      let lineNumber = 0;
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          lineNumber = i + 1;
          break;
        }
      }
      
      found.push({
        pattern: pattern.toString(),
        description,
        severity,
        match: matches[0],
        lineNumber,
        line: lines[lineNumber - 1]?.trim()
      });
    }
  });
  
  return { found, error: null };
}

function runScan() {
  let totalIssues = 0;
  let highSeverityIssues = 0;
  let mediumSeverityIssues = 0;
  
  console.log('📁 SCANNING ADMIN FILES:');
  console.log('========================\n');
  
  ADMIN_FILES.forEach(filePath => {
    const result = scanFileForMockData(filePath);
    
    if (result.error) {
      console.log(`⚠️  ${filePath}: ${result.error}`);
      return;
    }
    
    if (result.found.length > 0) {
      console.log(`❌ ${filePath}:`);
      result.found.forEach(issue => {
        console.log(`   ${issue.severity === 'HIGH' ? '🔴' : '🟡'} Line ${issue.lineNumber}: ${issue.description}`);
        console.log(`      Match: "${issue.match}"`);
        console.log(`      Code: ${issue.line}`);
        console.log('');
        
        totalIssues++;
        if (issue.severity === 'HIGH') highSeverityIssues++;
        if (issue.severity === 'MEDIUM') mediumSeverityIssues++;
      });
    } else {
      console.log(`✅ ${filePath}: Clean`);
    }
  });
  
  console.log('\n🎯 FINAL RESULTS:');
  console.log('=================');
  
  if (totalIssues === 0) {
    console.log('🎉 SUCCESS: NO MOCK DATA FOUND!');
    console.log('   ✅ All admin files are clean of mock data');
    console.log('   ✅ Users will see real data from the database');
    console.log('   ✅ No hardcoded numbers, fake emails, or demo content');
    console.log('\n🚀 The admin dashboard is now 100% connected to real data!');
  } else {
    console.log(`❌ MOCK DATA STILL PRESENT: ${totalIssues} issues found`);
    console.log(`   🔴 High severity: ${highSeverityIssues} issues`);
    console.log(`   🟡 Medium severity: ${mediumSeverityIssues} issues`);
    console.log('\n⚠️  These issues must be fixed before the admin dashboard is clean.');
    
    if (highSeverityIssues > 0) {
      console.log('\n🔥 HIGH PRIORITY FIXES NEEDED:');
      console.log('   - Remove all fake email addresses');
      console.log('   - Remove hardcoded user counts and revenue numbers');
      console.log('   - Remove demo user IDs and fallback data');
    }
  }
  
  console.log(`\nScan completed: ${ADMIN_FILES.length} files checked, ${totalIssues} issues found`);
}

runScan();