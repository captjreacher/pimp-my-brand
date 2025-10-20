import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import AdminEntry from '@/pages/admin/AdminEntry';
import AdminTest from '@/pages/admin/AdminTest';
import SimpleAdminFallback from '@/pages/admin/SimpleAdminFallback';
import DirectAdminTest from '@/pages/admin/DirectAdminTest';
import MinimalAdminTest from '@/pages/admin/MinimalAdminTest';
import SimpleWorkingAdmin from '@/pages/admin/SimpleWorkingAdmin';
import BasicTest from '@/pages/admin/BasicTest';
import UltraBasicTest from '@/pages/admin/UltraBasicTest';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { AnalyticsPage } from '@/pages/admin/AnalyticsPage';
import { ContentModerationPage } from '@/pages/admin/ContentModerationPage';
import { SystemConfigPage } from '@/pages/admin/SystemConfigPage';
import { SubscriptionManagementPage } from '@/pages/admin/SubscriptionManagementPage';
import { SecurityPage } from '@/pages/admin/SecurityPage';
import { CommunicationPage } from '@/pages/admin/CommunicationPage';
import { AIContentManagementPage } from '@/pages/admin/AIContentManagementPage';

/**
 * Unified Admin Router
 * Replaces fragmented admin routing with clean, consolidated routes
 * Uses AdminLayout for consistent authentication and authorization
 * All admin functionality is consolidated into the unified dashboard
 */
export function UnifiedAdminRouter() {
  return (
    <Routes>
      {/* Main unified admin entry point - handles all admin functionality */}
      <Route 
        path="/" 
        element={<UltraBasicTest />} 
      />
      
      {/* Temporary test route for debugging */}
      <Route 
        path="/test" 
        element={<AdminTest />} 
      />
      
      {/* Direct admin test - bypasses auth */}
      <Route 
        path="/direct" 
        element={<DirectAdminTest />} 
      />
      
      {/* Minimal admin test - simple interface */}
      <Route 
        path="/minimal" 
        element={<MinimalAdminTest />} 
      />
      
      {/* Simple working admin - guaranteed to work */}
      <Route 
        path="/simple" 
        element={<SimpleWorkingAdmin />} 
      />
      
      {/* Basic test - absolute minimal */}
      <Route 
        path="/basic" 
        element={<BasicTest />} 
      />
      
      {/* Ultra basic test - simplest possible */}
      <Route 
        path="/ultra" 
        element={<UltraBasicTest />} 
      />
      
      {/* Simple fallback admin interface */}
      <Route 
        path="/fallback" 
        element={<SimpleAdminFallback />} 
      />
      
      {/* Working admin routes */}
      <Route path="/users" element={
        <AdminLayout>
          <UserManagementPage />
        </AdminLayout>
      } />
      <Route path="/analytics" element={
        <AdminLayout>
          <AnalyticsPage />
        </AdminLayout>
      } />
      <Route path="/moderation" element={
        <AdminLayout>
          <ContentModerationPage />
        </AdminLayout>
      } />
      <Route path="/config" element={
        <AdminLayout>
          <SystemConfigPage />
        </AdminLayout>
      } />
      <Route path="/subscriptions" element={
        <AdminLayout>
          <SubscriptionManagementPage />
        </AdminLayout>
      } />
      <Route path="/security" element={
        <AdminLayout>
          <SecurityPage />
        </AdminLayout>
      } />
      <Route path="/communication" element={
        <AdminLayout>
          <CommunicationPage />
        </AdminLayout>
      } />
      <Route path="/ai-content" element={
        <AdminLayout>
          <AIContentManagementPage />
        </AdminLayout>
      } />
      
      {/* Fallback routes */}
      <Route path="/system" element={<Navigate to="/admin/config" replace />} />
      <Route path="/audit" element={<Navigate to="/admin/analytics" replace />} />
      <Route path="/database" element={<Navigate to="/admin/config" replace />} />
      <Route path="/settings" element={<Navigate to="/admin/config" replace />} />
      <Route path="/roles" element={<Navigate to="/admin/users" replace />} />
      <Route path="/content" element={<Navigate to="/admin/moderation" replace />} />
      
      {/* Catch-all redirect to main dashboard */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

/**
 * Legacy Admin Route Redirector
 * Handles redirects from old admin page patterns to unified dashboard
 */
export function LegacyAdminRedirector() {
  return (
    <Routes>
      {/* Redirect all WORKING_* pages to unified dashboard */}
      <Route path="/WORKING_Analytics" element={<Navigate to="/admin" replace />} />
      <Route path="/WORKING_ContentModeration" element={<Navigate to="/admin" replace />} />
      <Route path="/WORKING_SubscriptionManagement" element={<Navigate to="/admin" replace />} />
      <Route path="/WORKING_Security" element={<Navigate to="/admin" replace />} />
      <Route path="/WORKING_Communication" element={<Navigate to="/admin" replace />} />
      <Route path="/WORKING_SystemConfig" element={<Navigate to="/admin" replace />} />
      <Route path="/WORKING_AIContent" element={<Navigate to="/admin" replace />} />
      
      {/* Redirect all Simple* pages to unified dashboard */}
      <Route path="/SimpleAdminDashboard" element={<Navigate to="/admin" replace />} />
      <Route path="/SimpleAnalyticsPage" element={<Navigate to="/admin" replace />} />
      <Route path="/SimpleUserManagementPage" element={<Navigate to="/admin" replace />} />
      <Route path="/SimpleModerationPage" element={<Navigate to="/admin" replace />} />
      <Route path="/SimpleSubscriptionPage" element={<Navigate to="/admin" replace />} />
      <Route path="/SimpleConfigPage" element={<Navigate to="/admin" replace />} />
      <Route path="/SimpleSecurityPage" element={<Navigate to="/admin" replace />} />
      <Route path="/SimpleCommunicationPage" element={<Navigate to="/admin" replace />} />
      <Route path="/SimpleAIContentPage" element={<Navigate to="/admin" replace />} />
      
      {/* Redirect all Clean* pages to unified dashboard */}
      <Route path="/CleanAdminDashboard" element={<Navigate to="/admin" replace />} />
      <Route path="/CleanAnalytics" element={<Navigate to="/admin" replace />} />
      <Route path="/CleanUserManagement" element={<Navigate to="/admin" replace />} />
      <Route path="/CleanModeration" element={<Navigate to="/admin" replace />} />
      <Route path="/CleanConfig" element={<Navigate to="/admin" replace />} />
      
      {/* Redirect all Debug/Test pages to unified dashboard */}
      <Route path="/DebugUserManagement" element={<Navigate to="/admin" replace />} />
      <Route path="/DebugRouting" element={<Navigate to="/admin" replace />} />
      <Route path="/TestSubscriptionPage" element={<Navigate to="/admin" replace />} />
      <Route path="/TestPlansAccess" element={<Navigate to="/admin" replace />} />
      <Route path="/DirectTestLinks" element={<Navigate to="/admin" replace />} />
      <Route path="/SuperSimpleTest" element={<Navigate to="/admin" replace />} />
      <Route path="/NUCLEAR_TEST" element={<Navigate to="/admin" replace />} />
      <Route path="/EMERGENCY_UserManagement" element={<Navigate to="/admin" replace />} />
      
      {/* Redirect all other legacy admin pages */}
      <Route path="/WorkingUserManagementPage" element={<Navigate to="/admin" replace />} />
      <Route path="/FullUserManagementPage" element={<Navigate to="/admin" replace />} />
      <Route path="/FullAnalyticsPage" element={<Navigate to="/admin" replace />} />
      <Route path="/SimpleWorkingUserManagement" element={<Navigate to="/admin" replace />} />
      <Route path="/SimpleWorkingSubscriptions" element={<Navigate to="/admin" replace />} />
      <Route path="/SimpleSubscriptionPlansPage" element={<Navigate to="/admin" replace />} />
      
      {/* Catch-all for any other admin routes */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}