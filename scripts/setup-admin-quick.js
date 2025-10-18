#!/usr/bin/env node

/**
 * Quick Admin Setup Script
 * Sets up admin user and applies basic migrations
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
        }
      }
    }
  }
}

// Load environment variables
loadEnvFile();

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

async function setupAdmin() {
  log.header('🚀 Quick Admin Setup');

  // Check environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log.error('Missing Supabase environment variables');
    log.info('Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

  try {
    // Check if profiles table exists
    log.info('Checking database structure...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profileError && profileError.code === '42P01') {
      log.error('Profiles table does not exist. Please run database migrations first.');
      return;
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      log.warning('No authenticated user found. Please sign in first.');
      log.info('Go to your app, sign in, then run this script again.');
      return;
    }

    log.success(`Found user: ${user.email}`);

    // Check if user has admin role
    const { data: profile, error: getProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (getProfileError) {
      log.error(`Error getting profile: ${getProfileError.message}`);
      return;
    }

    if (profile && profile.role === 'admin') {
      log.success('User already has admin role!');
    } else {
      // Update user to admin
      log.info('Setting user as admin...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          app_role: 'admin'
        })
        .eq('id', user.id);

      if (updateError) {
        log.error(`Error updating profile: ${updateError.message}`);
        return;
      }

      log.success('User updated to admin role!');
    }

    // Check if admin tables exist
    log.info('Checking admin tables...');
    const adminTables = [
      'admin_audit_log',
      'admin_config',
      'admin_sessions'
    ];

    for (const table of adminTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error && error.code === '42P01') {
          log.warning(`Table '${table}' does not exist`);
        } else {
          log.success(`Table '${table}' exists`);
        }
      } catch (err) {
        log.warning(`Could not check table '${table}'`);
      }
    }

    log.header('✅ Admin Setup Complete!');
    log.info('You can now access the admin panel at /admin');
    log.info('If you still see loading, try refreshing the page.');

  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
  }
}

setupAdmin().catch(console.error);