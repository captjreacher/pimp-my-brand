import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Shield, AlertTriangle, Info } from 'lucide-react';
import { type AdminUserView, type UserRole } from '@/lib/admin/user-management-service';

interface ChangeRoleDialogProps {
  user: AdminUserView | null;
  currentAdminRole: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newRole: UserRole, notes?: string) => void;
  isLoading?: boolean;
}

const roleOptions: { value: UserRole; label: string; description: string; color: string }[] = [
  {
    value: 'user',
    label: 'User',
    description: 'Standard user with basic access',
    color: 'bg-gray-100 text-gray-800'
  },
  {
    value: 'moderator',
    label: 'Moderator',
    description: 'Can moderate content and manage basic user issues',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full administrative access except system configuration',
    color: 'bg-orange-100 text-orange-800'
  },
  {
    value: 'super_admin',
    label: 'Super Admin',
    description: 'Complete system access including admin management',
    color: 'bg-red-100 text-red-800'
  }
];

export const ChangeRoleDialog: React.FC<ChangeRoleDialogProps> = ({
  user,
  currentAdminRole,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (selectedRole) {
      onConfirm(selectedRole, notes.trim() || undefined);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedRole('');
    setNotes('');
    onClose();
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const canAssignRole = (role: UserRole) => {
    // Super admin can assign any role
    if (currentAdminRole === 'super_admin') {
      return true;
    }
    
    // Admin can assign user and moderator roles, but not admin or super_admin
    if (currentAdminRole === 'admin') {
      return ['user', 'moderator'].includes(role);
    }
    
    // Moderators cannot change roles
    return false;
  };

  const getRoleChangeWarning = (newRole: UserRole) => {
    if (!user) return null;
    
    const currentRole = user.app_role as UserRole;
    
    if (currentRole === 'super_admin' && newRole !== 'super_admin') {
      return {
        type: 'warning',
        message: 'Removing super admin privileges will revoke all system access.'
      };
    }
    
    if (currentRole === 'admin' && !['admin', 'super_admin'].includes(newRole)) {
      return {
        type: 'warning',
        message: 'Removing admin privileges will revoke administrative access.'
      };
    }
    
    if (['admin', 'super_admin'].includes(newRole) && !['admin', 'super_admin'].includes(currentRole)) {
      return {
        type: 'info',
        message: 'Granting admin privileges will provide administrative access.'
      };
    }
    
    return null;
  };

  if (!user) return null;

  const availableRoles = roleOptions.filter(role => canAssignRole(role.value));
  const currentRole = user.app_role as UserRole;
  const warning = selectedRole ? getRoleChangeWarning(selectedRole) : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Change User Role</span>
          </DialogTitle>
          <DialogDescription>
            Modify the user's role and permissions within the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {getInitials(user.full_name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-muted-foreground">Current role:</span>
                <Badge variant="outline" className="text-xs">
                  {roleOptions.find(r => r.value === currentRole)?.label || currentRole}
                </Badge>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label>Select New Role</Label>
            <div className="space-y-2">
              {availableRoles.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRole === role.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  } ${currentRole === role.value ? 'opacity-50' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    disabled={currentRole === role.value}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{role.label}</span>
                      {currentRole === role.value && (
                        <Badge variant="outline" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {role.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Role Change Warning */}
          {warning && (
            <div className={`p-3 border rounded-lg ${
              warning.type === 'warning' 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start space-x-2">
                {warning.type === 'warning' ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                ) : (
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                )}
                <p className={`text-sm ${
                  warning.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                  {warning.message}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Change Reason (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about why this role change is being made..."
              rows={3}
            />
          </div>

          {/* Permission Info */}
          {currentAdminRole !== 'super_admin' && (
            <div className="p-3 bg-muted/50 border rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Permission Note:</p>
                  <p className="mt-1">
                    You can only assign roles up to your current permission level. 
                    Contact a super admin to assign higher-level roles.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !selectedRole || selectedRole === currentRole}
          >
            {isLoading ? 'Changing Role...' : 'Change Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};