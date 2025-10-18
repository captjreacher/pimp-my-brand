// TRACE MOCK DATA SOURCE
// This will help identify exactly where the mock data is coming from
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read environment variables
const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 TRACING MOCK DATA SOURCE');
console.log('===========================');
console.log('Tell me EXACTLY what mock data you see, and I\'ll trace where it comes from\n');

async function checkCurrentRouting() {
  console.log('1. CHECKING CURRENT ADMIN ROUTING:');
  
  // Check App.tsx routing
  const appContent = fs.readFileSync('src/App.tsx', 'utf8');
  
  // Look for admin routes
  const adminRoutes = [];
  const routeMatches = appContent.match(/<Route path="\/admin[^"]*" element={<([^>]+)>/g);
  if (routeMatches) {
    routeMatches.forEach(match => {
      const pathMatch = match.match(/path="([^"]+)"/);
      const componentMatch = match.match(/element={<([^>]+)>/);
      if (pathMatch && componentMatch) {
        adminRoutes.push({
          path: pathMatch[1],
          component: componentMatch[1]
        });
      }
    });
  }
  
  console.log('   Admin routes found:');
  adminRoutes.forEach(route => {
    console.log(`   - ${route.path} → ${route.component}`);
  });
  
  // Check which components are being used
  const simpleRoutes = adminRoutes.filter(r => r.component.includes('Simple'));
  const complexRoutes = adminRoutes.filter(r => !r.component.includes('Simple'));
  
  console.log(`\n   Simple admin pages: ${simpleRoutes.length}`);
  console.log(`   Complex admin pages: ${complexRoutes.length}`);
  
  if (simpleRoutes.length > 0) {
    console.log('\n   ⚠️  You are using Simple admin pages!');
    console.log('   These were the ones with hardcoded mock data.');
  }
  
  return { adminRoutes, simpleRoutes, complexRoutes };
}

async function checkDatabaseConnection() {
  console.log('\n2. CHECKING DATABASE CONNECTION:');
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, app_role')
      .limit(3);
    
    if (error) {
      console.log('   ❌ Database connection failed:', error.message);
      console.log('   This could cause fallback to mock data');
      return { connected: false, error: error.message };
    }
    
    console.log('   ✅ Database connected successfully');
    console.log(`   Found ${profiles.length} real users:`);
    profiles.forEach(user => {
      console.log(`   - ${user.email} (${user.app_role})`);
    });
    
    return { connected: true, users: profiles };
    
  } catch (error) {
    console.log('   ❌ Database connection error:', error.message);
    return { connected: false, error: error.message };
  }
}

async function checkSpecificMockPatterns() {
  console.log('\n3. CHECKING FOR SPECIFIC MOCK PATTERNS:');
  
  // Common mock data patterns that might still exist
  const patterns = [
    { value: '1247', description: 'Hardcoded total users' },
    { value: '892', description: 'Hardcoded active users' },
    { value: '15420', description: 'Hardcoded revenue' },
    { value: 'john.doe@example.com', description: 'Fake email' },
    { value: 'user@example.com', description: 'Fake email' },
    { value: 'admin@example.com', description: 'Fake email' },
    { value: 'Tech Startup', description: 'Fake brand name' },
    { value: '98.5%', description: 'Hardcoded system health' }
  ];
  
  console.log('   Checking for these mock patterns in your browser:');
  patterns.forEach(pattern => {
    console.log(`   - ${pattern.value} (${pattern.description})`);
  });
  
  console.log('\n   📋 INSTRUCTIONS:');
  console.log('   1. Open your admin dashboard in the browser');
  console.log('   2. Look for ANY of the above values');
  console.log('   3. Tell me EXACTLY which values you see');
  console.log('   4. Tell me which page you\'re on (URL)');
}

async function checkBrowserCache() {
  console.log('\n4. BROWSER CACHE CHECK:');
  console.log('   Mock data might persist due to browser caching');
  console.log('   Try these steps:');
  console.log('   1. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)');
  console.log('   2. Clear browser cache completely');
  console.log('   3. Open in incognito/private mode');
  console.log('   4. Try a different browser');
}

async function runTrace() {
  const routing = await checkCurrentRouting();
  const database = await checkDatabaseConnection();
  await checkSpecificMockPatterns();
  await checkBrowserCache();
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('==============');
  console.log('Please tell me:');
  console.log('1. What URL are you visiting? (e.g., /admin, /admin/users, etc.)');
  console.log('2. What specific numbers/text do you see that looks like mock data?');
  console.log('3. Have you tried hard refresh (Ctrl+F5)?');
  console.log('4. Are you seeing the same data after clearing browser cache?');
  
  if (!database.connected) {
    console.log('\n⚠️  IMPORTANT: Database connection failed!');
    console.log('   This is likely why you\'re seeing mock data.');
    console.log('   The app falls back to mock data when it can\'t connect to the database.');
  }
}

runTrace();