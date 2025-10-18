// Script to run SQL diagnostics on Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function runDiagnostic() {
  console.log('Running SQL diagnostic...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // Check if app_role enum exists
    console.log('\n1. Checking if app_role enum exists...');
    const { data: enumData, error: enumError } = await supabase.rpc('check_enum_exists', {
      enum_name: 'app_role'
    });
    
    if (enumError) {
      console.log('❌ Error checking enum:', enumError.message);
    } else {
      console.log('✅ Enum check result:', enumData);
    }
    
    // Check profiles table structure
    console.log('\n2. Checking profiles table structure...');
    const { data: tableData, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.log('❌ Error checking table structure:', tableError.message);
    } else {
      console.log('✅ Table structure:');
      console.table(tableData);
    }
    
    // Try to select from profiles
    console.log('\n3. Testing profiles table access...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .limit(3);
    
    if (profilesError) {
      console.log('❌ Error accessing profiles:', profilesError.message);
    } else {
      console.log('✅ Profiles data:');
      console.table(profilesData);
    }
    
    // Check if we can run raw SQL
    console.log('\n4. Testing raw SQL execution...');
    const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'app_role'"
    });
    
    if (sqlError) {
      console.log('❌ Raw SQL failed:', sqlError.message);
    } else {
      console.log('✅ Raw SQL result:', sqlData);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

// Also create a simple function to run the fix
async function runFix() {
  console.log('\nRunning app_role column fix...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // Read the fix SQL file
    const fixSQL = fs.readFileSync('scripts/fix-app-role-column.sql', 'utf8');
    
    // Try to execute it (this might not work with the client, but let's try)
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: fixSQL
    });
    
    if (error) {
      console.log('❌ Fix failed:', error.message);
      console.log('You may need to run this SQL manually in your Supabase dashboard:');
      console.log(fixSQL);
    } else {
      console.log('✅ Fix applied successfully!');
      console.log('Result:', data);
    }
    
  } catch (err) {
    console.log('❌ Error running fix:', err.message);
  }
}

// Run diagnostic first
runDiagnostic().then(() => {
  // Then try to run the fix
  return runFix();
});