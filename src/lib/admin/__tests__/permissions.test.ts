import { describe, it, expect } from 'vitest';
import {
  getPermissionsForRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isModerator,
  isSuperAdmin,
  getRoleLevel,
  canManageRole,
  getAssignableRoles
} from '../permissions';
import type { AdminRole, AdminPermission } from '../types';

describe('Admin Permissions', () => {
  describe('getPermissionsForRole', () => {
    it('should return correct permissions for user role', () => {
      const permissions = getPermissionsForRole('user');
      expect(permissions.canManageUsers).toBe(false);
      expect(permissions.canModerateContent).toBe(false);
      expect(permissions.canManageBilling).toBe(false);
      expect(permissions.canViewAnalytics).toBe(false);
      expect(permissions.canManageSystem).toBe(false);
      expect(permissions.canViewAuditLogs).toBe(false);
    });

    it('should return correct permissions for moderator role', () => {
      const permissions = getPermissionsForRole('moderator');
      expect(permissions.canManageUsers).toBe(false);
      expect(permissions.canModerateContent).toBe(true);
      expect(permissions.canManageBilling).toBe(false);
      expect(permissions.canViewAnalytics).toBe(true);
      expect(permissions.canManageSystem).toBe(false);
      expect(permissions.canViewAuditLogs).toBe(false);
    });

    it('should return correct permissions for admin role', () => {
      const permissions = getPermissionsForRole('admin');
      expect(permissions.canManageUsers).toBe(true);
      expect(permissions.canModerateContent).toBe(true);
      expect(permissions.canManageBilling).toBe(true);
      expect(permissions.canViewAnalytics).toBe(true);
      expect(permissions.canManageSystem).toBe(false);
      expect(permissions.canViewAuditLogs).toBe(true);
    });

    it('should return correct permissions for super_admin role', () => {
      const permissions = getPermissionsForRole('super_admin');
      expect(permissions.canManageUsers).toBe(true);
      expect(permissions.canModerateContent).toBe(true);
      expect(permissions.canManageBilling).toBe(true);
      expect(permissions.canViewAnalytics).toBe(true);
      expect(permissions.canManageSystem).toBe(true);
      expect(permissions.canViewAuditLogs).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should correctly check individual permissions', () => {
      expect(hasPermission('user', 'manage_users')).toBe(false);
      expect(hasPermission('moderator', 'moderate_content')).toBe(true);
      expect(hasPermission('admin', 'manage_users')).toBe(true);
      expect(hasPermission('super_admin', 'manage_system')).toBe(true);
    });
  });

  describe('role hierarchy checks', () => {
    it('should correctly identify admin roles', () => {
      expect(isAdmin('user')).toBe(false);
      expect(isAdmin('moderator')).toBe(false);
      expect(isAdmin('admin')).toBe(true);
      expect(isAdmin('super_admin')).toBe(true);
    });

    it('should correctly identify moderator roles', () => {
      expect(isModerator('user')).toBe(false);
      expect(isModerator('moderator')).toBe(true);
      expect(isModerator('admin')).toBe(true);
      expect(isModerator('super_admin')).toBe(true);
    });

    it('should correctly identify super admin role', () => {
      expect(isSuperAdmin('user')).toBe(false);
      expect(isSuperAdmin('moderator')).toBe(false);
      expect(isSuperAdmin('admin')).toBe(false);
      expect(isSuperAdmin('super_admin')).toBe(true);
    });
  });

  describe('role management', () => {
    it('should correctly determine role management capabilities', () => {
      expect(canManageRole('super_admin', 'admin')).toBe(true);
      expect(canManageRole('admin', 'moderator')).toBe(true);
      expect(canManageRole('moderator', 'user')).toBe(false);
      expect(canManageRole('admin', 'super_admin')).toBe(false);
    });

    it('should return correct assignable roles', () => {
      expect(getAssignableRoles('super_admin')).toEqual(['user', 'moderator', 'admin', 'super_admin']);
      expect(getAssignableRoles('admin')).toEqual(['user', 'moderator', 'admin']);
      expect(getAssignableRoles('moderator')).toEqual(['user']);
      expect(getAssignableRoles('user')).toEqual([]);
    });
  });

  describe('role levels', () => {
    it('should return correct role levels', () => {
      expect(getRoleLevel('user')).toBe(0);
      expect(getRoleLevel('moderator')).toBe(1);
      expect(getRoleLevel('admin')).toBe(2);
      expect(getRoleLevel('super_admin')).toBe(3);
    });
  });
});