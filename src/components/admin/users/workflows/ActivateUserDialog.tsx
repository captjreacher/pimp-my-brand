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
import { UserCheck, CheckCircle, AlertTriangle } from 'lucide-react';
import { type AdminUserView } from '@/lib/admin/user-management-service';
import { format } from 'date-fns';

interface ActivateUserDialogProps {
  user: AdminUserView | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  isLoading?: boolean;
}

export const ActivateUserDialog: React.FC<ActivateUserDialogProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            <span>Activate User</span>
          </DialogTitle>
          <DialogDescription>
            This will restore the user's account access and make their content visible again.
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
                <Badge variant="outline" className="text-xs">
                  {user.app_role.replace('_', ' ')}
                </Badge>
                <Badge variant="destructive" className="text-xs">
                  Currently Suspended
                </Badge>
              </div>
            </div>
          </div>

          {/* Suspension Details */}
          {user.is_suspended && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Current Suspension:</p>
                  <div className="mt-1 space-y-1 text-muted-foreground">
                    <p>• Suspended: {formatDate(user.suspended_at)}</p>
                    {user.suspension_reason && (
                      <p>• Reason: {user.suspension_reason}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activation Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Activation Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about why this user is being activated..."
              rows={3}
            />
          </div>

          {/* Activation Effects */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800">Activation Effects:</p>
                <ul className="mt-1 text-green-700 space-y-1">
                  <li>• User will regain account access</li>
                  <li>• Public content will be restored</li>
                  <li>• User will receive activation notification</li>
                  <li>• Suspension record will be cleared</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Activating...' : 'Activate User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};