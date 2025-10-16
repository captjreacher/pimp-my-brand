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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, AlertTriangle, Database, FileText } from 'lucide-react';
import { type AdminUserView } from '@/lib/admin/user-management-service';

interface DeleteUserDialogProps {
  user: AdminUserView | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes?: string) => void;
  isLoading?: boolean;
}

const deletionReasons = [
  'User Request',
  'Terms of Service Violation',
  'Spam Account',
  'Duplicate Account',
  'Security Breach',
  'GDPR Deletion Request',
  'Inactive Account Cleanup',
  'Other'
];

export const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [acknowledgeDataLoss, setAcknowledgeDataLoss] = useState(false);
  const [acknowledgeIrreversible, setAcknowledgeIrreversible] = useState(false);

  const handleConfirm = () => {
    const finalReason = reason === 'Other' ? customReason : reason;
    if (finalReason.trim() && isFormValid) {
      onConfirm(finalReason.trim(), notes.trim() || undefined);
      handleClose();
    }
  };

  const handleClose = () => {
    setReason('');
    setCustomReason('');
    setNotes('');
    setConfirmationText('');
    setAcknowledgeDataLoss(false);
    setAcknowledgeIrreversible(false);
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

  const expectedConfirmation = `DELETE ${user.email}`;
  const isFormValid = 
    reason && 
    (reason !== 'Other' || customReason.trim()) &&
    confirmationText === expectedConfirmation &&
    acknowledgeDataLoss &&
    acknowledgeIrreversible;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <span>Delete User Account</span>
          </DialogTitle>
          <DialogDescription>
            This action will permanently delete the user account and all associated data.
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
                <Badge variant="outline" className="text-xs">
                  {user.total_generations} generations
                </Badge>
              </div>
            </div>
          </div>

          {/* Data Impact Warning */}
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive mb-2">Data That Will Be Deleted:</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span>User profile and account information</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{user.content_count} content items (brands, CVs)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span>All user-generated content and files</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span>Activity logs and usage history</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deletion Reason */}
          <div className="space-y-3">
            <Label>Deletion Reason *</Label>
            <div className="space-y-2">
              {deletionReasons.map((reasonOption) => (
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
              placeholder="Add any additional context about this deletion..."
              rows={3}
            />
          </div>

          {/* Acknowledgment Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acknowledge-data-loss"
                checked={acknowledgeDataLoss}
                onCheckedChange={(checked) => setAcknowledgeDataLoss(checked as boolean)}
              />
              <Label htmlFor="acknowledge-data-loss" className="text-sm leading-5">
                I understand that all user data will be permanently deleted and cannot be recovered.
              </Label>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acknowledge-irreversible"
                checked={acknowledgeIrreversible}
                onCheckedChange={(checked) => setAcknowledgeIrreversible(checked as boolean)}
              />
              <Label htmlFor="acknowledge-irreversible" className="text-sm leading-5">
                I understand that this action is irreversible and the user account cannot be restored.
              </Label>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <code className="bg-muted px-1 py-0.5 rounded text-sm">{expectedConfirmation}</code> to confirm deletion
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={expectedConfirmation}
              className={confirmationText === expectedConfirmation ? 'border-green-500' : ''}
            />
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
            {isLoading ? 'Deleting...' : 'Delete User Permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};