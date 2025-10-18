#!/usr/bin/env node

/**
 * Migration Script: Vercel to Self-Managed Supabase
 * 
 * This script helps migrate from Vercel-managed Supabase to self-managed
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

class SupabaseMigrator {
  constructor() {
    this.oldSupabase = null;
    this.newSupabase = null;
  }

  async migrate() {
    log.header('🚀 Supabase Migration from Vercel');
    
    try {
      await this.validateEnvironment();
      await this.connectToInstances();
      await this.exportSchema();
      await this.exportData();
      await this.exportStorageFiles();
      await this.generateMigrationScript();
      
      log.success('Migration preparation complete!');
      log.info('Next steps:');
      log.info('1. Review generated migration files');
      log.info('2. Set up your new Supabase project');
      log.info('3. Run the migration script');
      log.info('4. Update your frontend environment variables');
      log.info('5. Deploy to your chosen hosting platform');
      
    } catch (error) {
      log.error(`Migration failed: ${error.message}`);
      process.exit(1);
    }
  }

  async validateEnvironment() {
    log.header('Environment Validation');
    
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    for (const varName of requiredVars) {
      if (process.env[varName]) {
        log.success(`${varName} found`);
      } else {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }
  }

  async connectToInstances() {
    log.header('Connecting to Supabase');
    
    this.oldSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test connection
    const { data, error } = await this.oldSupabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to connect to current Supabase: ${error.message}`);
    }

    log.success('Connected to current Supabase instance');
  }

  async exportSchema() {
    log.header('Exporting Database Schema');
    
    try {
      // This would typically use pg_dump or Supabase CLI
      // For now, we'll create a placeholder
      const schemaExport = `-- Database Schema Export
-- Generated on ${new Date().toISOString()}
-- 
-- This file contains the schema for your Supabase database
-- Run this against your new Supabase instance

-- Note: Use 'supabase db diff' and 'supabase db push' for actual migration
-- This is a placeholder for manual review

-- Tables to migrate:
-- - profiles
-- - brands  
-- - cvs
-- - uploads
-- - shares
-- - subscriptions
-- - admin_* tables

-- Run your existing migrations:
-- supabase db push

SELECT 'Schema export placeholder - use Supabase CLI for actual migration' as note;
`;

      fs.writeFileSync(
        path.join(__dirname, '..', 'migration-exports', 'schema.sql'),
        schemaExport
      );
      
      log.success('Schema export template created');
    } catch (error) {
      log.error(`Schema export failed: ${error.message}`);
    }
  }

  async exportData() {
    log.header('Exporting Data');
    
    const tables = ['profiles', 'brands', 'cvs', 'uploads', 'shares'];
    const exportDir = path.join(__dirname, '..', 'migration-exports', 'data');
    
    // Create export directory
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    for (const table of tables) {
      try {
        const { data, error } = await this.oldSupabase
          .from(table)
          .select('*');

        if (error) {
          log.warning(`Could not export ${table}: ${error.message}`);
          continue;
        }

        fs.writeFileSync(
          path.join(exportDir, `${table}.json`),
          JSON.stringify(data, null, 2)
        );
        
        log.success(`Exported ${data?.length || 0} records from ${table}`);
      } catch (error) {
        log.warning(`Failed to export ${table}: ${error.message}`);
      }
    }
  }

  async exportStorageFiles() {
    log.header('Exporting Storage Files');
    
    try {
      const { data: files, error } = await this.oldSupabase.storage
        .from('uploads')
        .list();

      if (error) {
        log.warning(`Could not list storage files: ${error.message}`);
        return;
      }

      const storageExport = {
        bucket: 'uploads',
        files: files || [],
        exportedAt: new Date().toISOString(),
        note: 'Use Supabase CLI or dashboard to migrate storage files'
      };

      fs.writeFileSync(
        path.join(__dirname, '..', 'migration-exports', 'storage.json'),
        JSON.stringify(storageExport, null, 2)
      );
      
      log.success(`Found ${files?.length || 0} storage files`);
      log.info('Storage files need to be manually migrated');
    } catch (error) {
      log.warning(`Storage export failed: ${error.message}`);
    }
  }

  async generateMigrationScript() {
    log.header('Generating Migration Script');
    
    const migrationScript = `#!/bin/bash

# Supabase Migration Script
# Generated on ${new Date().toISOString()}

echo "🚀 Starting Supabase Migration"

# Step 1: Set up new Supabase project
echo "📋 Setting up new Supabase project..."
supabase projects create your-project-name
supabase link --project-ref YOUR_NEW_PROJECT_REF

# Step 2: Deploy schema
echo "🗄️ Deploying database schema..."
supabase db push

# Step 3: Deploy Edge Functions
echo "⚡ Deploying Edge Functions..."
supabase functions deploy generate-style
supabase functions deploy generate-visual
supabase functions deploy generate-brand-rider
supabase functions deploy generate-cv

# Step 4: Set function secrets
echo "🔐 Setting function secrets..."
supabase secrets set LOVABLE_API_KEY=\${LOVABLE_API_KEY}

# Step 5: Create storage buckets
echo "📦 Setting up storage..."
supabase storage create uploads --public=false

# Step 6: Import data (manual step)
echo "📊 Data import needs to be done manually"
echo "Check migration-exports/data/ folder for exported data"

# Step 7: Validate migration
echo "✅ Running validation..."
npm run validate:deployment

echo "🎉 Migration complete!"
echo "Don't forget to:"
echo "1. Update your environment variables"
echo "2. Deploy your frontend to new hosting platform"
echo "3. Update DNS settings"
echo "4. Test all functionality"
`;

    fs.writeFileSync(
      path.join(__dirname, '..', 'migration-exports', 'migrate.sh'),
      migrationScript
    );
    
    // Make script executable
    fs.chmodSync(
      path.join(__dirname, '..', 'migration-exports', 'migrate.sh'),
      0o755
    );
    
    log.success('Migration script generated');
  }
}

// Create migration exports directory
const exportDir = path.join(__dirname, '..', 'migration-exports');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrator = new SupabaseMigrator();
  migrator.migrate().catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

export default SupabaseMigrator;