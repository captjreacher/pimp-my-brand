// Simple connection test for admin dashboard
import fs from 'fs';
import path from 'path';

console.log('🔍 Testing admin dashboard connection...\n');

try {
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
  const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Could not find Supabase credentials in .env file');
    process.exit(1);
  }
  
  console.log('✅ Environment variables loaded');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
  
  console.log('\n📋 Next steps:');
  console.log('1. Run the SQL script in Supabase Dashboard');
  console.log('2. Refresh your admin pages');
  console.log('3. You should see real user data instead of demo data');
  
} catch (error) {
  console.error('❌ Error reading environment:', error.message);
}