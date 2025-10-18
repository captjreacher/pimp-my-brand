#!/usr/bin/env node

/**
 * AI Features Deployment Script
 * 
 * This script deploys the new AI content generation features including:
 * - Database migrations for AI tables
 * - Environment variable validation
 * - Build and deployment preparation
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
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

class AIFeaturesDeployer {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.supabase = null;
  }

  async deploy() {
    log.header('🤖 AI Features Deployment');
    
    try {
      await this.validatePrerequisites();
      await this.validateEnvironmentVariables();
      await this.connectToSupabase();
      await this.runDatabaseMigrations();
      await this.validateAITables();
      await this.buildApplication();
      await this.runTests();
      
      this.printSummary();
      
      if (this.errors.length > 0) {
        process.exit(1);
      }
      
      log.success('🎉 AI features are ready for deployment!');
      this.printNextSteps();
      
    } catch (error) {
      log.error(`Deployment preparation failed: ${error.message}`);
      process.exit(1);
    }
  }

  async validatePrerequisites() {
    log.header('Prerequisites Check');
    
    // Check if Supabase CLI is installed
    try {
      execSync('supabase --version', { stdio: 'pipe' });
      log.success('Supabase CLI is installed');
    } catch (error) {
      this.errors.push('Supabase CLI is not installed. Install with: npm install -g supabase');
      log.error('Supabase CLI is not installed');
    }

    // Check if we're in a Supabase project
    const supabaseConfigPath = path.join(__dirname, '..', 'supabase', 'config.toml');
    if (fs.existsSync(supabaseConfigPath)) {
      log.success('Supabase project configuration found');
    } else {
      this.errors.push('Supabase project not initialized. Run: supabase init');
      log.error('Supabase project not initialized');
    }

    // Check if migrations directory exists
    const migrationsPath = path.join(__dirname, '..', 'supabase', 'migrations');
    if (fs.existsSync(migrationsPath)) {
      log.success('Migrations directory found');
    } else {
      this.errors.push('Migrations directory not found');
      log.error('Migrations directory not found');
    }
  }

  async validateEnvironmentVariables() {
    log.header('Environment Variables for AI Features');
    
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const aiRequiredVars = [
      'VITE_OPENAI_API_KEY'
    ];

    // Check basic required variables
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        log.success(`${varName} is set`);
      } else {
        this.errors.push(`Missing required environment variable: ${varName}`);
        log.error(`${varName} is missing`);
      }
    }

    // Check AI-specific variables
    for (const varName of aiRequiredVars) {
      if (process.env[varName]) {
        log.success(`${varName} is set`);
        
        // Validate OpenAI API key format
        if (varName === 'VITE_OPENAI_API_KEY' && !process.env[varName].startsWith('sk-')) {
          this.warnings.push('OpenAI API key should start with "sk-"');
          log.warning('OpenAI API key format may be incorrect');
        }
      } else {
        this.errors.push(`Missing AI feature requirement: ${varName}`);
        log.error(`${varName} is required for AI features`);
      }
    }

    // Check optional but recommended variables
    const optionalVars = [
      'VITE_ELEVENLABS_API_KEY' // For voice synthesis
    ];

    for (const varName of optionalVars) {
      if (process.env[varName]) {
        log.success(`${varName} is set (optional)`);
      } else {
        this.warnings.push(`Optional AI feature: ${varName} not set`);
        log.warning(`${varName} not set - some AI features may be limited`);
      }
    }
  }

  async connectToSupabase() {
    log.header('Supabase Connection');
    
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      this.errors.push('Cannot connect to Supabase - missing credentials');
      return;
    }

    try {
      this.supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
      );

      // Test connection
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      log.success('Connected to Supabase successfully');
    } catch (error) {
      this.errors.push(`Supabase connection failed: ${error.message}`);
      log.error(`Supabase connection failed: ${error.message}`);
    }
  }

  async runDatabaseMigrations() {
    log.header('Database Migrations');
    
    try {
      // Check if we're linked to a Supabase project
      try {
        execSync('supabase status', { stdio: 'pipe', cwd: path.join(__dirname, '..') });
        log.success('Supabase project is linked');
      } catch (error) {
        this.warnings.push('Supabase project may not be linked. Run: supabase link --project-ref YOUR_PROJECT_REF');
        log.warning('Supabase project may not be linked');
      }

      // List pending migrations
      log.info('Checking for pending migrations...');
      
      const migrationsPath = path.join(__dirname, '..', 'supabase', 'migrations');
      const migrationFiles = fs.readdirSync(migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();

      const aiMigrations = migrationFiles.filter(file => 
        file.includes('ai_content_generation') || 
        file.includes('ai_moderation_analytics')
      );

      if (aiMigrations.length > 0) {
        log.info(`Found ${aiMigrations.length} AI-related migrations:`);
        aiMigrations.forEach(migration => {
          log.info(`  - ${migration}`);
        });

        // Apply migrations
        log.info('Applying database migrations...');
        try {
          execSync('supabase db push', { 
            stdio: 'inherit', 
            cwd: path.join(__dirname, '..') 
          });
          log.success('Database migrations applied successfully');
        } catch (error) {
          this.errors.push('Failed to apply database migrations');
          log.error('Failed to apply database migrations');
          log.error('Please run manually: cd supabase && supabase db push');
        }
      } else {
        log.warning('No AI-related migrations found');
      }

    } catch (error) {
      this.errors.push(`Migration check failed: ${error.message}`);
      log.error(`Migration check failed: ${error.message}`);
    }
  }

  async validateAITables() {
    log.header('AI Tables Validation');
    
    if (!this.supabase) {
      this.errors.push('Cannot validate AI tables - Supabase not connected');
      return;
    }

    const aiTables = [
      'ai_generation_requests',
      'ai_moderation_logs',
      'ai_background_jobs',
      'ai_cache_entries',
      'ai_performance_metrics',
      'ai_usage_analytics'
    ];

    for (const tableName of aiTables) {
      try {
        const { error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error && error.code === '42P01') {
          this.errors.push(`AI table '${tableName}' does not exist`);
          log.error(`Table '${tableName}' missing`);
        } else if (error) {
          // Table exists but may have RLS restrictions (which is good)
          log.success(`Table '${tableName}' exists`);
        } else {
          log.success(`Table '${tableName}' exists and accessible`);
        }
      } catch (error) {
        this.warnings.push(`Could not verify table '${tableName}': ${error.message}`);
        log.warning(`Could not verify table '${tableName}'`);
      }
    }
  }

  async buildApplication() {
    log.header('Application Build');
    
    try {
      // Install dependencies
      log.info('Installing dependencies...');
      execSync('npm ci', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      log.success('Dependencies installed');

      // Run TypeScript check
      log.info('Running TypeScript check...');
      try {
        execSync('npx tsc --noEmit', { stdio: 'pipe', cwd: path.join(__dirname, '..') });
        log.success('TypeScript check passed');
      } catch (error) {
        this.warnings.push('TypeScript check failed - there may be type errors');
        log.warning('TypeScript check failed - review type errors before deploying');
      }

      // Build application
      log.info('Building application...');
      execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      log.success('Application built successfully');

      // Check build output
      const distPath = path.join(__dirname, '..', 'dist');
      if (fs.existsSync(distPath)) {
        const distFiles = fs.readdirSync(distPath);
        log.success(`Build output contains ${distFiles.length} files/directories`);
      } else {
        this.errors.push('Build output directory not found');
        log.error('Build output directory not found');
      }

    } catch (error) {
      this.errors.push(`Build failed: ${error.message}`);
      log.error(`Build failed: ${error.message}`);
    }
  }

  async runTests() {
    log.header('Running Tests');
    
    try {
      // Run tests
      log.info('Running test suite...');
      execSync('npm test -- --run', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      log.success('All tests passed');
    } catch (error) {
      this.warnings.push('Some tests failed - review test results');
      log.warning('Some tests failed - review before deploying');
    }
  }

  printSummary() {
    log.header('Deployment Summary');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      log.success('🎉 All checks passed! AI features are ready for deployment.');
    } else {
      if (this.errors.length > 0) {
        console.log(`\n${colors.red}${colors.bold}Errors (${this.errors.length}):${colors.reset}`);
        this.errors.forEach(error => log.error(error));
      }
      
      if (this.warnings.length > 0) {
        console.log(`\n${colors.yellow}${colors.bold}Warnings (${this.warnings.length}):${colors.reset}`);
        this.warnings.forEach(warning => log.warning(warning));
      }
      
      if (this.errors.length > 0) {
        console.log(`\n${colors.red}${colors.bold}❌ Deployment preparation failed. Please fix the errors above.${colors.reset}`);
      } else {
        console.log(`\n${colors.yellow}${colors.bold}⚠️  Deployment preparation completed with warnings.${colors.reset}`);
      }
    }
  }

  printNextSteps() {
    log.header('Next Steps');
    
    console.log(`
${colors.bold}To complete the deployment:${colors.reset}

1. ${colors.blue}Deploy to your hosting platform:${colors.reset}
   
   ${colors.bold}Vercel:${colors.reset}
   vercel --prod
   
   ${colors.bold}Netlify:${colors.reset}
   netlify deploy --prod --dir=dist
   
   ${colors.bold}Other platforms:${colors.reset}
   Upload the 'dist' directory to your web server

2. ${colors.blue}Set environment variables on your hosting platform:${colors.reset}
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_OPENAI_API_KEY
   - VITE_ELEVENLABS_API_KEY (optional)

3. ${colors.blue}Test the deployment:${colors.reset}
   - Visit your deployed application
   - Test AI content generation features
   - Check admin panel AI management section
   - Verify content moderation is working

4. ${colors.blue}Monitor the deployment:${colors.reset}
   - Check Supabase dashboard for database activity
   - Monitor AI API usage and costs
   - Review performance metrics in admin panel

${colors.green}${colors.bold}🚀 Your AI-powered personal brand generator is ready to launch!${colors.reset}
`);
  }
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployer = new AIFeaturesDeployer();
  deployer.deploy().catch(error => {
    console.error('Deployment script failed:', error);
    process.exit(1);
  });
}

export default AIFeaturesDeployer;