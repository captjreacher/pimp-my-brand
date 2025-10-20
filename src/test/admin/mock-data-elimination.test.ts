import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Mock Data Elimination Tests', () => {
  describe('Source Code Analysis', () => {
    it('should not contain mock data patterns in consolidated admin service', () => {
      const servicePath = join(process.cwd(), 'src/lib/admin/consolidated-admin-service.ts');
      const serviceCode = readFileSync(servicePath, 'utf-8');
      
      // Check for common mock data patterns
      expect(serviceCode).not.toContain('mockData');
      expect(serviceCode).not.toContain('fakeData');
      expect(serviceCode).not.toContain('testData');
      
      // Check for mock user patterns
      expect(serviceCode).not.toContain('john.doe@example.com');
      expect(serviceCode).not.toContain('jane.smith@example.com');
      expect(serviceCode).not.toContain('test@example.com');
      
      // Check for hardcoded mock revenue values
      expect(serviceCode).not.toContain('45231');
      expect(serviceCode).not.toContain('34865');
      
      // Verify it uses real Supabase queries
      expect(serviceCode).toContain('supabase');
      expect(serviceCode).toContain('profiles');
      expect(serviceCode).toContain('brands');
      expect(serviceCode).toContain('cvs');
      expect(serviceCode).toContain('.from(');
    });

    it('should not contain mock data patterns in unified admin dashboard', () => {
      const dashboardPath = join(process.cwd(), 'src/pages/admin/UnifiedAdminDashboard.tsx');
      const dashboardCode = readFileSync(dashboardPath, 'utf-8');
      
      // Check for mock data usage
      expect(dashboardCode).not.toContain('mockContent');
      expect(dashboardCode).not.toContain('mockSubscriptions');
      expect(dashboardCode).not.toContain('mockStats');
      
      // Verify it uses consolidated service
      expect(dashboardCode).toContain('consolidatedAdminService');
      
      // Check for hardcoded test values
      expect(dashboardCode).not.toContain('test@example.com');
      expect(dashboardCode).not.toContain('fake@email.com');
    });
  });

  describe('File Cleanup Verification', () => {
    it('should have removed all WORKING_* admin pages', () => {
      const adminDir = join(process.cwd(), 'src/pages/admin');
      const files = require('fs').readdirSync(adminDir);
      
      const workingFiles = files.filter((file: string) => file.startsWith('WORKING_'));
      expect(workingFiles).toHaveLength(0);
    });

    it('should have removed all Simple* admin pages', () => {
      const adminDir = join(process.cwd(), 'src/pages/admin');
      const files = require('fs').readdirSync(adminDir);
      
      const simpleFiles = files.filter((file: string) => file.startsWith('Simple'));
      expect(simpleFiles).toHaveLength(0);
    });

    it('should have removed all Clean* admin pages', () => {
      const adminDir = join(process.cwd(), 'src/pages/admin');
      const files = require('fs').readdirSync(adminDir);
      
      const cleanFiles = files.filter((file: string) => file.startsWith('Clean'));
      expect(cleanFiles).toHaveLength(0);
    });

    it('should have removed all Debug/Test admin pages', () => {
      const adminDir = join(process.cwd(), 'src/pages/admin');
      const files = require('fs').readdirSync(adminDir);
      
      const debugTestFiles = files.filter((file: string) => 
        file.startsWith('Debug') || 
        file.startsWith('Test') || 
        file.startsWith('NUCLEAR') ||
        file.startsWith('EMERGENCY') ||
        file.includes('Test')
      );
      expect(debugTestFiles).toHaveLength(0);
    });

    it('should have removed all real-*-service.ts files', () => {
      const adminLibDir = join(process.cwd(), 'src/lib/admin');
      const files = require('fs').readdirSync(adminLibDir);
      
      const realServiceFiles = files.filter((file: string) => 
        file.startsWith('real-') && file.endsWith('-service.ts')
      );
      expect(realServiceFiles).toHaveLength(0);
    });
  });

  describe('Supabase Integration Verification', () => {
    it('should only use real database tables', () => {
      const servicePath = join(process.cwd(), 'src/lib/admin/consolidated-admin-service.ts');
      const serviceCode = readFileSync(servicePath, 'utf-8');
      
      // Verify real table usage
      expect(serviceCode).toContain('profiles');
      expect(serviceCode).toContain('brands');
      expect(serviceCode).toContain('cvs');
      expect(serviceCode).toContain('admin_audit_log');
      
      // Verify no mock table usage
      expect(serviceCode).not.toContain('mock_users');
      expect(serviceCode).not.toContain('fake_brands');
      expect(serviceCode).not.toContain('test_content');
    });

    it('should use proper error handling without mock fallbacks', () => {
      const servicePath = join(process.cwd(), 'src/lib/admin/consolidated-admin-service.ts');
      const serviceCode = readFileSync(servicePath, 'utf-8');
      
      // Should have try/catch blocks
      expect(serviceCode).toContain('try {');
      expect(serviceCode).toContain('catch (error)');
      
      // Should return zeros on error, not mock data
      expect(serviceCode).toContain('return {');
      expect(serviceCode).toContain('totalUsers: 0');
      expect(serviceCode).toContain('monthlyRevenue: 0');
    });
  });
});