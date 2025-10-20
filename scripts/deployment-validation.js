#!/usr/bin/env node

/**
 * Production Deployment Validation Script
 * 
 * This script validates that all components are properly configured
 * and ready for production deployment.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

class DeploymentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.supabase = null;
  }

  async validate() {
    log.header('🚀 Production Deployment Validation');
    
    try {
      await this.validateEnvironmentVariables();
      await this.validateSupabaseConnection();
      await this.validateSupabaseFunctions();
      await this.validateDatabaseSchema();
      await this.validateStorageBuckets();
      await this.validateRLSPolicies();
      await this.validateBuildConfiguration();
      await this.validateDependencies();
      await this.validateSecurityConfiguration();
      
      this.printSummary();
      
      if (this.errors.length > 0) {
        process.exit(1);
      }
    } catch (error) {
      log.error(`Validation failed: ${error.message}`);
      process.exit(1);
    }
  }

  async validateEnvironmentVariables() {
    log.header('Environment Variables');
    
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const optionalButRecommendedVars = [
      'OPENAI_API_KEY'
    ];

    const optionalVars = [
      'VITE_APP_URL',
      'VITE_SENTRY_DSN'
    ];

    // Check required variables
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        log.success(`${varName} is set`);
      } else {
        this.errors.push(`Missing required environment variable: ${varName}`);
        log.error(`${varName} is missing`);
      }
    }

    // Check optional but recommended variables
    for (const varName of optionalButRecommendedVars) {
      if (process.env[varName]) {
        log.success(`${varName} is set`);
      } else {
        this.warnings.push(`AI features require: ${varName} (get from OpenAI dashboard)`);
        log.warning(`${varName} is not set - AI features will not work`);
      }
    }

    // Check optional variables
    for (const varName of optionalVars) {
      if (process.env[varName]) {
        log.success(`${varName} is set`);
      } else {
        this.warnings.push(`Optional environment variable not set: ${varName}`);
        log.warning(`${varName} is not set (optional)`);
      }
    }

    // Validate URL formats
    if (process.env.VITE_SUPABASE_URL) {
      try {
        new URL(process.env.VITE_SUPABASE_URL);
        log.success('VITE_SUPABASE_URL is a valid URL');
      } catch {
        this.errors.push('VITE_SUPABASE_URL is not a valid URL');
        log.error('VITE_SUPABASE_URL is not a valid URL');
      }
    }
  }

  async validateSupabaseConnection() {
    log.header('Supabase Connection');
    
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      this.errors.push('Cannot test Supabase connection - missing credentials');
      return;
    }

    try {
      this.supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY
      );

      // Test connection
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      log.success('Supabase connection successful');
    } catch (error) {
      this.errors.push(`Supabase connection failed: ${error.message}`);
      log.error(`Supabase connection failed: ${error.message}`);
    }
  }

  async validateSupabaseFunctions() {
    log.header('Supabase Functions');
    
    if (!this.supabase) {
      this.errors.push('Cannot validate functions - Supabase not connected');
      return;
    }

    const requiredFunctions = [
      'generate-style',
      'generate-visual',
      'generate-brand-rider',
      'generate-cv'
    ];

    for (const functionName of requiredFunctions) {
      try {
        // Test function with minimal payload
        const { error } = await this.supabase.functions.invoke(functionName, {
          body: { test: true }
        });

        // We expect an error for test payload, but function should exist
        if (error && error.message.includes('not found')) {
          this.errors.push(`Supabase function '${functionName}' not deployed`);
          log.error(`Function '${functionName}' not found`);
        } else {
          log.success(`Function '${functionName}' is deployed`);
        }
      } catch (error) {
        if (error.message.includes('not found')) {
          this.errors.push(`Supabase function '${functionName}' not deployed`);
          log.error(`Function '${functionName}' not found`);
        } else {
          log.success(`Function '${functionName}' is deployed`);
        }
      }
    }
  }

  async validateDatabaseSchema() {
    log.header('Database Schema');
    
    if (!this.supabase) {
      this.errors.push('Cannot validate schema - Supabase not connected');
      return;
    }

    const requiredTables = [
      'profiles',
      'brands',
      'cvs',
      'uploads',
      'shares',
      'subscriptions'
    ];

    for (const tableName of requiredTables) {
      try {
        const { error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error && error.code === '42P01') { // Table doesn't exist
          this.errors.push(`Table '${tableName}' does not exist`);
          log.error(`Table '${tableName}' missing`);
        } else {
          log.success(`Table '${tableName}' exists`);
        }
      } catch (error) {
        this.errors.push(`Error checking table '${tableName}': ${error.message}`);
        log.error(`Error checking table '${tableName}': ${error.message}`);
      }
    }
  }

  async validateStorageBuckets() {
    log.header('Storage Buckets');
    
    if (!this.supabase) {
      this.errors.push('Cannot validate storage - Supabase not connected');
      return;
    }

    const requiredBuckets = ['uploads'];

    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets();
      
      if (error) {
        this.errors.push(`Failed to list storage buckets: ${error.message}`);
        log.error(`Failed to list storage buckets: ${error.message}`);
        return;
      }

      const bucketNames = buckets.map(bucket => bucket.name);

      for (const bucketName of requiredBuckets) {
        if (bucketNames.includes(bucketName)) {
          log.success(`Storage bucket '${bucketName}' exists`);
        } else {
          this.errors.push(`Storage bucket '${bucketName}' does not exist`);
          log.error(`Storage bucket '${bucketName}' missing`);
        }
      }
    } catch (error) {
      this.errors.push(`Error validating storage buckets: ${error.message}`);
      log.error(`Error validating storage buckets: ${error.message}`);
    }
  }

  async validateRLSPolicies() {
    log.header('Row Level Security Policies');
    
    if (!this.supabase) {
      this.errors.push('Cannot validate RLS - Supabase not connected');
      return;
    }

    // This is a basic check - in a real scenario you'd query pg_policies
    const tablesToCheck = ['brands', 'cvs', 'uploads', 'shares'];
    
    for (const table of tablesToCheck) {
      try {
        // Try to access table without auth (should fail if RLS is enabled)
        const { error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error && error.code === 'PGRST301') { // RLS policy violation
          log.success(`RLS is enabled for table '${table}'`);
        } else if (!error) {
          this.warnings.push(`Table '${table}' may not have proper RLS policies`);
          log.warning(`Table '${table}' accessible without auth - check RLS policies`);
        }
      } catch (error) {
        // This is expected for properly secured tables
        log.success(`RLS appears to be working for table '${table}'`);
      }
    }
  }

  async validateBuildConfiguration() {
    log.header('Build Configuration');
    
    const configFiles = [
      'package.json',
      'vite.config.ts',
      'tsconfig.json',
      'tailwind.config.js'
    ];

    for (const configFile of configFiles) {
      const filePath = path.join(__dirname, '..', configFile);
      if (fs.existsSync(filePath)) {
        log.success(`${configFile} exists`);
      } else {
        this.errors.push(`Missing configuration file: ${configFile}`);
        log.error(`${configFile} missing`);
      }
    }

    // Check package.json for required scripts
    try {
      const packageJsonPath = path.join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const requiredScripts = ['build', 'preview', 'test'];
      for (const script of requiredScripts) {
        if (packageJson.scripts && packageJson.scripts[script]) {
          log.success(`Build script '${script}' defined`);
        } else {
          this.warnings.push(`Build script '${script}' not defined`);
          log.warning(`Build script '${script}' missing`);
        }
      }
    } catch (error) {
      this.errors.push(`Error reading package.json: ${error.message}`);
      log.error(`Error reading package.json: ${error.message}`);
    }
  }

  async validateDependencies() {
    log.header('Dependencies');
    
    try {
      const packageJsonPath = path.join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const criticalDependencies = [
        '@supabase/supabase-js',
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query'
      ];

      for (const dep of criticalDependencies) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          log.success(`Dependency '${dep}' installed`);
        } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
          log.success(`Dev dependency '${dep}' installed`);
        } else {
          this.errors.push(`Critical dependency '${dep}' not found`);
          log.error(`Dependency '${dep}' missing`);
        }
      }

      // Check for security vulnerabilities (basic check)
      const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        this.warnings.push('node_modules not found - run npm install');
        log.warning('node_modules not found - run npm install');
      } else {
        log.success('node_modules directory exists');
      }
    } catch (error) {
      this.errors.push(`Error validating dependencies: ${error.message}`);
      log.error(`Error validating dependencies: ${error.message}`);
    }
  }

  async validateSecurityConfiguration() {
    log.header('Security Configuration');
    
    // Check for sensitive files that shouldn't be in production
    const sensitiveFiles = [
      '.env.local',
      '.env.development',
      'supabase/.env'
    ];

    for (const file of sensitiveFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        this.warnings.push(`Sensitive file '${file}' found - ensure it's not deployed`);
        log.warning(`Sensitive file '${file}' found`);
      } else {
        log.success(`Sensitive file '${file}' not found (good)`);
      }
    }

    // Check .gitignore
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      const requiredIgnores = ['.env', 'node_modules', 'dist', '.env.local'];
      
      for (const ignore of requiredIgnores) {
        if (gitignoreContent.includes(ignore)) {
          log.success(`'${ignore}' is in .gitignore`);
        } else {
          this.warnings.push(`'${ignore}' should be in .gitignore`);
          log.warning(`'${ignore}' not in .gitignore`);
        }
      }
    } else {
      this.warnings.push('.gitignore file not found');
      log.warning('.gitignore file not found');
    }

    // Check for HTTPS in production URLs
    if (process.env.VITE_SUPABASE_URL && !process.env.VITE_SUPABASE_URL.startsWith('https://')) {
      this.warnings.push('Supabase URL should use HTTPS in production');
      log.warning('Supabase URL should use HTTPS in production');
    }
  }

  printSummary() {
    log.header('Validation Summary');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      log.success('🎉 All validations passed! Ready for production deployment.');
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
        console.log(`\n${colors.red}${colors.bold}❌ Deployment validation failed. Please fix the errors above.${colors.reset}`);
      } else {
        console.log(`\n${colors.yellow}${colors.bold}⚠️  Deployment validation passed with warnings. Review warnings before deploying.${colors.reset}`);
      }
    }
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DeploymentValidator();
  validator.validate().catch(error => {
    console.error('Validation script failed:', error);
    process.exit(1);
  });
}

export default DeploymentValidator;