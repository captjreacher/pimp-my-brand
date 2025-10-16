import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminContext } from '@/contexts/AdminContext';
import { AdminRouteGuard } from '@/components/admin/AdminRouteGuard';
import { SecurityPage } from '@/pages/admin/SecurityPage';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { supabase } from '@/integrations/supabase/client';
import type { AdminUser, AdminPermissions } from '@/lib/admin/types';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Mock crypto for MFA testing
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockReturnValue(new Uint8Array(32)),
    subtle: {
      generateKey: vi.fn(),
      exportKey: vi.fn(),
      importKey: vi.fn(),
    },
  },
});

const mockAdminUser: AdminUser = {
  id: 'admin-user-1',
  email: 'admin@test.com',
  app_role: 'admin',
  admin_permissions: ['manage_users', 'moderate_content', 'manage_billing', 'view_analytics'],
  last_admin_login: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockModeratorUser: AdminUser = {
  id: 'moderator-user-1',
  email: 'moderator@test.com',
  app_role: 'moderator',
  admin_permissions: ['moderate_content'],
  last_admin_login: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockRegularUser: AdminUser = {
  id: 'regular-user-1',
  email: 'user@test.com',
  app_role: 'user',
  admin_permissions: [],
  last_admin_login: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const createTestWrapper = (user: AdminUser, permissions: AdminPermissions) => {
  return ({ children }: { children: React.ReactNode }) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminContext.Provider
            value={{
              user,
              permissions,
              isLoading: false,
              error: null,
              refreshUser: vi.fn(),
            }}
          >
            {children}
          </AdminContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };
};

describe('Admin Security Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('should prevent unauthorized access to admin routes', async () => {
      const TestWrapper = createTestWrapper(mockRegularUser, {
        canManageUsers: false,
        canModerateContent: false,
        canManageBilling: false,
        canViewAnalytics: false,
        canManageSystem: false,
      });

      render(
        <TestWrapper>
          <AdminRouteGuard>
            <UserManagementPage />
          </AdminRouteGuard>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/unauthorized access/i)).toBeInTheDocument();
      });

      // Should not show admin content
      expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    });

    it('should enforce role-based permissions correctly', async () => {
      const ModeratorWrapper = createTestWrapper(mockModeratorUser, {
        canManageUsers: false,
        canModerateContent: true,
        canManageBilling: false,
        canViewAnalytics: false,
        canManageSystem: false,
      });

      render(
        <ModeratorWrapper>
          <AdminRouteGuard requiredPermission="canManageUsers">
            <UserManagementPage />
          </AdminRouteGuard>
        </ModeratorWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument();
      });
    });

    it('should validate admin session integrity', async () => {
      const AdminWrapper = createTestWrapper(mockAdminUser, {
        canManageUsers: true,
        canModerateContent: true,
        canManageBilling: true,
        canViewAnalytics: true,
        canManageSystem: true,
      });

      // Mock expired session
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' },
      });

      render(
        <AdminWrapper>
          <AdminRouteGuard>
            <UserManagementPage />
          </AdminRouteGuard>
        </AdminWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/session expired/i)).toBeInTheDocument();
      });
    });

    it('should handle privilege escalation attempts', async () => {
      const TestWrapper = createTestWrapper(mockModeratorUser, {
        canManageUsers: false,
        canModerateContent: true,
        canManageBilling: false,
        canViewAnalytics: false,
        canManageSystem: false,
      });

      // Mock API call that tries to escalate privileges
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockRejectedValue({
            message: 'Insufficient permissions',
            code: 'INSUFFICIENT_PRIVILEGES',
          }),
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <TestWrapper>
          <UserManagementPage />
        </TestWrapper>
      );

      // Try to perform admin action as moderator
      const suspendButton = screen.queryByRole('button', { name: /suspend user/i });
      
      if (suspendButton) {
        fireEvent.click(suspendButton);

        await waitFor(() => {
          expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Multi-Factor Authentication', () => {
    beforeEach(() => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ mfa_enabled: false, backup_codes: null }],
          error: null,
        }),
        insert: vi.fn().mockResolvedValue({
          data: [{ id: 'mfa-1', secret: 'test-secret' }],
          error: null,
        }),
        update: vi.fn().mockResolvedValue({
          data: [{ mfa_enabled: true }],
          error: null,
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);
    });

    it('should enforce MFA setup for admin users', async () => {
      const AdminWrapper = createTestWrapper(mockAdminUser, {
        canManageUsers: true,
        canModerateContent: true,
        canManageBilling: true,
        canViewAnalytics: true,
        canManageSystem: true,
      });

      render(
        <AdminWrapper>
          <SecurityPage />
        </AdminWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Multi-Factor Authentication')).toBeInTheDocument();
      });

      // Should show MFA setup requirement
      expect(screen.getByText(/mfa not configured/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /setup mfa/i })).toBeInTheDocument();
    });

    it('should validate MFA setup process', async () => {
      const AdminWrapper = createTestWrapper(mockAdminUser, {
        canManageUsers: true,
        canModerateContent: true,
        canManageBilling: true,
        canViewAnalytics: true,
        canManageSystem: true,
      });

      render(
        <AdminWrapper>
          <SecurityPage />
        </AdminWrapper>
      );

      // Start MFA setup
      const setupButton = screen.getByRole('button', { name: /setup mfa/i });
      fireEvent.click(setupButton);

      await waitFor(() => {
        expect(screen.getByText('QR Code')).toBeInTheDocument();
      });

      // Enter invalid verification code
      const codeInput = screen.getByPlaceholderText(/enter verification code/i);
      fireEvent.change(codeInput, { target: { value: '000000' } });

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid verification code/i)).toBeInTheDocument();
      });

      // Enter valid verification code
      fireEvent.change(codeInput, { target: { value: '123456' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText(/mfa successfully configured/i)).toBeInTheDocument();
      });
    });

    it('should validate backup codes generation', async () => {
      const AdminWrapper = createTestWrapper(mockAdminUser, {
        canManageUsers: true,
        canModerateContent: true,
        canManageBilling: true,
        canViewAnalytics: true,
        canManageSystem: true,
      });

      render(
        <AdminWrapper>
          <SecurityPage />
        </AdminWrapper>
      );

      // Generate backup codes
      const generateCodesButton = screen.getByRole('button', { name: /generate backup codes/i });
      fireEvent.click(generateCodesButton);

      await waitFor(() => {
        expect(screen.getByText(/backup codes generated/i)).toBeInTheDocument();
      });

      // Should show 10 backup codes
      const backupCodes = screen.getAllByText(/^\d{8}$/);
      expect(backupCodes).toHaveLength(10);
    });
  });

  describe('Session Management', () => {
    it('should enforce admin session timeouts', async () => {
      const AdminWrapper = createTestWrapper(mockAdminUser, {
        canManageUsers: true,
        canModerateContent: true,
        canManageBilling: true,
        canViewAnalytics: true,
        canManageSystem: true,
      });

      render(
        <AdminWrapper>
          <UserManagementPage />
        </AdminWrapper>
      );

      // Mock session timeout
      setTimeout(() => {
        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: null },
          error: { message: 'Session expired' },
        });
      }, 100);

      await waitFor(() => {
        expect(screen.getByText(/session expired/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should track concurrent admin sessions', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'session-1',
            user_id: 'admin-user-1',
            ip_address: '192.168.1.100',
            user_agent: 'Mozilla/5.0...',
            session_start: new Date().toISOString(),
            is_active: true,
          },
          {
            id: 'session-2',
            user_id: 'admin-user-1',
            ip_address: '192.168.1.101',
            user_agent: 'Mozilla/5.0...',
            session_start: new Date(Date.now() - 3600000).toISOString(),
            is_active: true,
          },
        ],
        error: null,
      });

      (supabase.rpc as any).mockImplementation(mockRpc);

      const AdminWrapper = createTestWrapper(mockAdminUser, {
        canManageUsers: true,
        canModerateContent: true,
        canManageBilling: true,
        canViewAnalytics: true,
        canManageSystem: true,
      });

      render(
        <AdminWrapper>
          <SecurityPage />
        </AdminWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Active Sessions')).toBeInTheDocument();
      });

      // Should show multiple active sessions
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.101')).toBeInTheDocument();

      // Should allow terminating other sessions
      const terminateButtons = screen.getAllByRole('button', { name: /terminate session/i });
      expect(terminateButtons).toHaveLength(1); // Can't terminate current session
    });
  });

  describe('Audit Trail Security', () => {
    it('should prevent audit log tampering', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'audit-1',
              admin_user_id: 'admin-user-1',
              action_type: 'user_suspended',
              target_type: 'user',
              target_id: 'user-1',
              details: { reason: 'Policy violation' },
              created_at: '2024-01-15T12:00:00Z',
              checksum: 'abc123def456',
            },
          ],
          error: null,
        }),
        update: vi.fn().mockRejectedValue({
          message: 'Audit logs are immutable',
          code: 'IMMUTABLE_RECORD',
        }),
        delete: vi.fn().mockRejectedValue({
          message: 'Audit logs cannot be deleted',
          code: 'IMMUTABLE_RECORD',
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const AdminWrapper = createTestWrapper(mockAdminUser, {
        canManageUsers: true,
        canModerateContent: true,
        canManageBilling: true,
        canViewAnalytics: true,
        canManageSystem: true,
      });

      render(
        <AdminWrapper>
          <SecurityPage />
        </AdminWrapper>
      );

      // Navigate to audit logs
      const auditTab = screen.getByRole('tab', { name: /audit logs/i });
      fireEvent.click(auditTab);

      await waitFor(() => {
        expect(screen.getByText('user_suspended')).toBeInTheDocument();
      });

      // Audit logs should be read-only
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('should validate audit log integrity', async () => {
      const mockRpc = vi.fn().mockImplementation((functionName: string) => {
        if (functionName === 'validate_audit_integrity') {
          return Promise.resolve({
            data: {
              total_logs: 1000,
              validated_logs: 998,
              corrupted_logs: 2,
              integrity_score: 0.998,
            },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      (supabase.rpc as any).mockImplementation(mockRpc);

      const AdminWrapper = createTestWrapper(mockAdminUser, {
        canManageUsers: true,
        canModerateContent: true,
        canManageBilling: true,
        canViewAnalytics: true,
        canManageSystem: true,
      });

      render(
        <AdminWrapper>
          <SecurityPage />
        </AdminWrapper>
      );

      // Run integrity check
      const integrityButton = screen.getByRole('button', { name: /check integrity/i });
      fireEvent.click(integrityButton);

      await waitFor(() => {
        expect(screen.getByText('99.8%')).toBeInTheDocument(); // Integrity score
        expect(screen.getByText('2 corrupted logs detected')).toBeInTheDocument();
      });
    });
  });

  describe('IP Restrictions and Monitoring', () => {
    it('should enforce IP allowlisting for admin access', async () => {
      // Mock IP restriction check
      const mockRpc = vi.fn().mockImplementation((functionName: string) => {
        if (functionName === 'check_admin_ip_access') {
          return Promise.resolve({
            data: { allowed: false, ip_address: '192.168.1.999' },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      (supabase.rpc as any).mockImplementation(mockRpc);

      const AdminWrapper = createTestWrapper(mockAdminUser, {
        canManageUsers: true,
        canModerateContent: true,
        canManageBilling: true,
        canViewAnalytics: true,
        canManageSystem: true,
      });

      render(
        <AdminWrapper>
          <AdminRouteGuard>
            <UserManagementPage />
          </AdminRouteGuard>
        </AdminWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/access denied from this ip address/i)).toBeInTheDocument();
      });
    });

    it('should monitor suspicious login attempts', async () => {
      const mockSuspiciousAttempts = [
        {
          id: 'attempt-1',
          user_email: 'admin@test.com',
          ip_address: '192.168.1.999',
          success: false,
          attempted_at: '2024-01-15T10:30:00Z',
          failure_reason: 'invalid_password',
          risk_score: 85,
        },
        {
          id: 'attempt-2',
          user_email: 'admin@test.com',
          ip_address: '192.168.1.999',
          success: false,
          attempted_at: '2024-01-15T10:31:00Z',
          failure_reason: 'invalid_password',
          risk_score: 90,
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockSuspiciousAttempts,
          error: null,
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const AdminWrapper = createTestWrapper(mockAdminUser, {
        canManageUsers: true,
        canModerateContent: true,
        canManageBilling: true,
        canViewAnalytics: true,
        canManageSystem: true,
      });

      render(
        <AdminWrapper>
          <SecurityPage />
        </AdminWrapper>
      );

      // Navigate to login monitoring
      const loginTab = screen.getByRole('tab', { name: /login attempts/i });
      fireEvent.click(loginTab);

      await waitFor(() => {
        expect(screen.getByText('192.168.1.999')).toBeInTheDocument();
        expect(screen.getByText('Risk Score: 90')).toBeInTheDocument();
      });

      // Should show option to block suspicious IP
      expect(screen.getByRole('button', { name: /block ip/i })).toBeInTheDocument();
    });
  });

  describe('Data Protection and Privacy', () => {
    it('should mask sensitive user data appropriately', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@test.com',
          full_name: 'Test User 1',
          phone: '+1234567890',
          ssn: '123-45-6789',
          credit_card: '4111-1111-1111-1111',
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockUsers,
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const AdminWrapper = createTestWrapper(mockAdminUser, {
        canManageUsers: true,
        canModerateContent: true,
        canManageBilling: true,
        canViewAnalytics: true,
        canManageSystem: true,
      });

      render(
        <AdminWrapper>
          <UserManagementPage />
        </AdminWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('user1@test.com')).toBeInTheDocument();
      });

      // Sensitive data should be masked
      expect(screen.getByText('***-**-6789')).toBeInTheDocument(); // SSN
      expect(screen.getByText('****-****-****-1111')).toBeInTheDocument(); // Credit card
      expect(screen.getByText('+***-***-7890')).toBeInTheDocument(); // Phone
    });

    it('should enforce data access logging', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: { logged: true },
        error: null,
      });

      (supabase.rpc as any).mockImplementation(mockRpc);

      const AdminWrapper = createTestWrapper(mockAdminUser, {
        canManageUsers: true,
        canModerateContent: true,
        canManageBilling: true,
        canViewAnalytics: true,
        canManageSystem: true,
      });

      render(
        <AdminWrapper>
          <UserManagementPage />
        </AdminWrapper>
      );

      // Click on user to view details
      await waitFor(() => {
        const userRow = screen.getByText('user1@test.com');
        fireEvent.click(userRow);
      });

      // Data access should be logged
      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('log_data_access', 
          expect.objectContaining({
            admin_user_id: 'admin-user-1',
            accessed_data_type: 'user_profile',
            target_user_id: 'user-1',
          })
        );
      });
    });
  });
});