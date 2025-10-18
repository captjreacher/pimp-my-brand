// Check brands table schema
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBrandsSchema() {
  console.log('🔍 Checking brands table schema...\n');
  
  try {
    const { data: brands, error } = await supabase
      .from('brands')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing brands:', error.message);
      return;
    }
    
    if (brands && brands.length > 0) {
      console.log('✅ Brands table accessible');
      console.log('📋 Available columns:');
      Object.keys(brands[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof brands[0][column]}`);
      });
      
      console.log('\n📊 Sample brand data:');
      console.log(JSON.stringify(brands[0], null, 2));
    } else {
      console.log('⚠️  No brands found in table');
    }
    
  } catch (error) {
    console.error('❌ Failed to check schema:', error.message);
  }
}

checkBrandsSchema();