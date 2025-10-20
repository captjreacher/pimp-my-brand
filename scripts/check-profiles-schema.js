// Check what columns exist in profiles table
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesSchema() {
  console.log('🔍 Checking profiles table schema...\n');
  
  try {
    // Try to get a sample profile to see what columns exist
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing profiles:', error.message);
      return;
    }
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Profiles table accessible');
      console.log('📋 Available columns:');
      Object.keys(profiles[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof profiles[0][column]}`);
      });
      
      console.log('\n📊 Sample profile data:');
      console.log(JSON.stringify(profiles[0], null, 2));
    } else {
      console.log('⚠️  No profiles found in table');
    }
    
  } catch (error) {
    console.error('❌ Failed to check schema:', error.message);
  }
}

checkProfilesSchema();