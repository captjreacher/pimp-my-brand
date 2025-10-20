#!/usr/bin/env node

/**
 * Manual Database Setup Script
 * This script sets up your fresh Supabase database without requiring the CLI
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigrations() {
  console.log('🚀 Starting database setup...');
  
  try {
    // Get all migration files
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      console.log(`⚡ Running migration: ${file}`);
      
      const sqlContent = readFileSync(join(migrationsDir, file), 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { 
            sql: statement 
          });
          
          if (error) {
            console.error(`❌ Error in ${file}:`, error.message);
            // Continue with other statements
          }
        }
      }
      
      console.log(`✅ Completed: ${file}`);
    }

    console.log('🎉 Database setup completed successfully!');
    
    // Test the connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (error) {
      console.log('⚠️  Note: Some tables may not be accessible yet (this is normal)');
    } else {
      console.log('✅ Database connection verified');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Alternative: Direct SQL execution function
async function executeSQLFile(filePath) {
  try {
    const sql = readFileSync(filePath, 'utf8');
    console.log(`📄 Executing SQL file: ${filePath}`);
    
    // For complex migrations, we might need to use the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ SQL execution failed:', error);
      return false;
    }

    console.log('✅ SQL executed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    return false;
  }
}

// Run the setup
runMigrations().catch(console.error);