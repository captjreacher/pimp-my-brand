// Test what the Simple admin pages are actually outputting
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read environment variables
const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTING SIMPLE ADMIN PAGES OUTPUT');
console.log('====================================');

async function testSimpleUserManagementData() {
  console.log('\n1. Testing SimpleUserManagementPage data:');
  
  try {
    // Simulate the exact same query as SimpleUserManagementPage
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, app_role, subscription_tier, created_at, is_suspended');

    if (profilesError) {
      console.log('   ❌ Database query failed:', profilesError.message);
      console.log('   This would show: "Database error" message');
      console.log('   Users would be: [] (empty array)');
      return;
    }

    console.log('   ✅ Database query successful');
    console.log(`   Users array length: ${profiles.length}`);
    
    // Calculate stats exactly like the component does
    const total = profiles?.length || 0;
    const active = total; // Assume all users are active for now
    const admins = profiles?.filter(p => ['admin', 'moderator', 'super_admin'].includes(p.app_role)).length || 0;
    const suspended = profiles?.filter(p => p.is_suspended).length || 0;

    console.log('   Stats that would be displayed:');
    console.log(`   - Total Users: ${total}`);
    console.log(`   - Active Users: ${active}`);
    console.log(`   - Admin Users: ${admins}`);
    console.log(`   - Suspended Users: ${suspended}`);
    
    console.log('   User list that would be displayed:');
    profiles.slice(0, 3).forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email} (${user.app_role || 'user'})`);
    });
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

async function testSimpleAdminDashboardData() {
  console.log('\n2. Testing SimpleAdminDashboard data:');
  
  try {
    // Simulate the exact same queries as SimpleAdminDashboard
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('*');

    const { data: cvs, error: cvsError } = await supabase
      .from('cvs')
      .select('*');

    if (profilesError || brandsError || cvsError) {
      console.log('   ❌ Some queries failed');
      console.log('   This would show zeros for failed queries');
      return;
    }

    // Calculate stats exactly like the component does
    const totalUsers = profiles?.length || 0;
    const activeUsers = totalUsers; // All registered users are considered active
    const totalBrands = brands?.length || 0;
    const totalCVs = cvs?.length || 0;

    console.log('   Stats that would be displayed:');
    console.log(`   - Total Users: ${totalUsers}`);
    console.log(`   - Active Users: ${activeUsers}`);
    console.log(`   - Total Brands: ${totalBrands}`);
    console.log(`   - Total CVs: ${totalCVs}`);
    console.log(`   - Active Sessions: ${activeUsers} (same as active users)`);
    console.log(`   - System Health: 100% (hardcoded)`);
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

async function checkForHardcodedValues() {
  console.log('\n3. Checking for any remaining hardcoded values:');
  
  const filesToCheck = [
    'src/pages/admin/SimpleAdminDashboard.tsx',
    'src/pages/admin/SimpleUserManagementPage.tsx',
    'src/pages/admin/SimpleSubscriptionPage.tsx',
    'src/pages/admin/SimpleAnalyticsPage.tsx'
  ];
  
  const suspiciousPatterns = [
    /\b1247\b/,
    /\b892\b/,
    /\b15420\b/,
    /\b98\.5\b/,
    /john\.doe@example\.com/,
    /user@example\.com/,
    /admin@example\.com/
  ];
  
  let foundIssues = [];
  
  filesToCheck.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          const match = content.match(pattern);
          foundIssues.push({
            file: filePath,
            pattern: pattern.toString(),
            match: match[0]
          });
        }
      });
    }
  });
  
  if (foundIssues.length > 0) {
    console.log('   ❌ Found hardcoded values:');
    foundIssues.forEach(issue => {
      console.log(`   - ${issue.file}: "${issue.match}"`);
    });
  } else {
    console.log('   ✅ No hardcoded mock values found in Simple pages');
  }
}

async function runTest() {
  await testSimpleUserManagementData();
  await testSimpleAdminDashboardData();
  await checkForHardcodedValues();
  
  console.log('\n🎯 CONCLUSION:');
  console.log('==============');
  console.log('If you\'re still seeing mock data, it could be:');
  console.log('1. Browser cache - try incognito mode');
  console.log('2. Different URL - make sure you\'re on /admin');
  console.log('3. JavaScript bundle cache - restart dev server');
  console.log('4. Different component being loaded');
  console.log('\nPlease tell me the EXACT URL and EXACT mock values you see.');
}

runTest();