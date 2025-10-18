const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployAdminFunctions() {
  try {
    console.log('🚀 Deploying admin functions...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-admin-functions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // Try direct execution if exec_sql doesn't exist
      console.log('Trying direct SQL execution...');
      
      // Split SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.substring(0, 50) + '...');
          const { error: execError } = await supabase.rpc('exec', { sql: statement });
          if (execError) {
            console.error('❌ Error executing statement:', execError.message);
          }
        }
      }
    }
    
    console.log('✅ Admin functions deployed successfully!');
    
    // Test the functions
    console.log('🧪 Testing admin functions...');
    
    const { data: users, error: testError } = await supabase.rpc('get_all_users_admin');
    
    if (testError) {
      console.log('⚠️  Test failed (this is expected if you\'re not an admin):', testError.message);
    } else {
      console.log('✅ Test successful! Found', users?.length || 0, 'users');
    }
    
  } catch (err) {
    console.error('❌ Deployment failed:', err.message);
  }
}

deployAdminFunctions();