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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle, UserX } from 'lucide-react';
import { type AdminUserView } from '@/lib/admin/user-management-service';

interface SuspendUserDialogProps {
  user: AdminUserView | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes?: string) => void;
  isLoading?: boolean;
}

const suspensionReasons = [
  'Violation of Terms of Service',
  'Inappropriate Content',
  'Spam or Abuse',
  'Security Concerns',
  'Payment Issues',
  'User Request',
  'Other'
];

export const SuspendUserDialog: React.FC<SuspendUserDialogProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    const finalReason = reason === 'Other' ? customReason : reason;
    if (finalReason.trim()) {
      onConfirm(finalReason.trim(), notes.trim() || undefined);
      handleClose();
    }
  };

  const handleClose = () => {
    setReason('');
    setCustomReason('');
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

  if (!user) return null;

  const isFormValid = reason && (reason !== 'Other' || customReason.trim());

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Suspend User</span>
          </DialogTitle>
          <DialogDescription>
            This will prevent the user from accessing their account and hide their public content.
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
                <Badge variant="outline" className="text-xs">
                  {user.content_count} content items
                </Badge>
              </div>
            </div>
          </div>

          {/* Suspension Reason */}
          <div className="space-y-3">
            <Label>Suspension Reason *</Label>
            <div className="space-y-2">
              {suspensionReasons.map((reasonOption) => (
                <label key={reasonOption} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={reasonOption}
                    checked={reason === reasonOption}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-primary"
                  />
                  <span className="text-sm">{reasonOption}</span>
                </label>
              ))}
            </div>
            
            {reason === 'Other' && (
              <Input
                placeholder="Enter custom reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional context or notes about this suspension..."
              rows={3}
            />
          </div>

          {/* Warning */}
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <UserX className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Suspension Effects:</p>
                <ul className="mt-1 text-muted-foreground space-y-1">
                  <li>• User will be logged out immediately</li>
                  <li>• Account access will be blocked</li>
                  <li>• Public content will be hidden</li>
                  <li>• User will receive suspension notification</li>
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
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? 'Suspending...' : 'Suspend User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};