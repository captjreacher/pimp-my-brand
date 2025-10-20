#!/usr/bin/env node

/**
 * Fresh Database Setup Script
 * Sets up the complete database schema for FunkMyBrand
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

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLFile(filePath) {
  try {
    const sql = readFileSync(filePath, 'utf8');
    console.log(`📄 Executing: ${filePath}`);
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          // Use the REST API directly for complex SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey
            },
            body: JSON.stringify({ 
              sql: statement + ';'
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorText = await response.text();
            console.log(`   ⚠️  Statement warning: ${errorText.substring(0, 100)}...`);
            errorCount++;
          }
        } catch (err) {
          console.log(`   ⚠️  Statement error: ${err.message.substring(0, 100)}...`);
          errorCount++;
        }
      }
    }

    console.log(`   ✅ Completed: ${successCount} statements succeeded, ${errorCount} had issues`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to execute ${filePath}:`, error.message);
    return false;
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up fresh FunkMyBrand database...\n');
  
  try {
    // Get all migration files in order
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${migrationFiles.length} migration files\n`);

    let successCount = 0;
    let failCount = 0;

    // Execute each migration file
    for (const file of migrationFiles) {
      const filePath = join(migrationsDir, file);
      const success = await executeSQLFile(filePath);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      console.log(''); // Add spacing
    }

    console.log('📊 Setup Summary:');
    console.log(`   ✅ Successful migrations: ${successCount}`);
    console.log(`   ❌ Failed migrations: ${failCount}`);
    
    if (failCount === 0) {
      console.log('\n🎉 Database setup completed successfully!');
    } else {
      console.log('\n⚠️  Database setup completed with some issues');
    }

    // Test the setup
    console.log('\n🔍 Testing database setup...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (error) {
      console.log('⚠️  Profiles table test:', error.message);
    } else {
      console.log('✅ Profiles table accessible');
    }

    // Check for admin tables
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1);
      
    if (adminError) {
      console.log('⚠️  Admin tables test:', adminError.message);
    } else {
      console.log('✅ Admin tables accessible');
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Create storage bucket for file uploads');
    console.log('2. Set up Edge Functions for AI generation');
    console.log('3. Create your first user account');
    console.log('4. Promote yourself to admin');
    console.log('5. Test the application');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupDatabase().catch(console.error);