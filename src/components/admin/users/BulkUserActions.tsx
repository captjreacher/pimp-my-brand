import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  UserX,
  UserCheck,
  Trash2,
  ChevronDown,
  AlertTriangle,
  Download
} from 'lucide-react';

interface BulkUserActionsProps {
  selectedUsers: string[];
  onBulkAction: (action: 'suspend' | 'activate' | 'delete', reason?: string, notes?: string) => void;
  onExport: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

interface BulkActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string, notes?: string) => void;
  action: 'suspend' | 'activate' | 'delete' | null;
  userCount: number;
  isLoading?: boolean;
}

const BulkActionDialog: React.FC<BulkActionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  userCount,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(reason || undefined, notes || undefined);
    setReason('');
    setNotes('');
  };

  const handleClose = () => {
    onClose();
    setReason('');
    setNotes('');
  };

  const getActionDetails = () => {
    switch (action) {
      case 'suspend':
        return {
          title: 'Suspend Users',
          description: `Are you sure you want to suspend ${userCount} user(s)? This will prevent them from accessing their accounts.`,
          buttonText: 'Suspend Users',
          buttonVariant: 'destructive' as const,
          requiresReason: true
        };
      case 'activate':
        return {
          title: 'Activate Users',
          description: `Are you sure you want to activate ${userCount} user(s)? This will restore their account access.`,
          buttonText: 'Activate Users',
          buttonVariant: 'default' as const,
          requiresReason: false
        };
      case 'delete':
        return {
          title: 'Delete Users',
          description: `Are you sure you want to delete ${userCount} user(s)? This action cannot be undone.`,
          buttonText: 'Delete Users',
          buttonVariant: 'destructive' as const,
          requiresReason: true
        };
      default:
        return null;
    }
  };

  const actionDetails = getActionDetails();

  if (!actionDetails) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>{actionDetails.title}</span>
          </DialogTitle>
          <DialogDescription>
            {actionDetails.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {actionDetails.requiresReason && (
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason {action === 'suspend' || action === 'delete' ? '(Required)' : '(Optional)'}
              </Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Enter reason for ${action}...`}
                required={actionDetails.requiresReason}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Admin Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={actionDetails.buttonVariant}
            onClick={handleConfirm}
            disabled={isLoading || (actionDetails.requiresReason && !reason.trim())}
          >
            {isLoading ? 'Processing...' : actionDetails.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const BulkUserActions: React.FC<BulkUserActionsProps> = ({
  selectedUsers,
  onBulkAction,
  onExport,
  onClearSelection,
  isLoading = false
}) => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    action: 'suspend' | 'activate' | 'delete' | null;
  }>({
    isOpen: false,
    action: null
  });

  const handleActionClick = (action: 'suspend' | 'activate' | 'delete') => {
    setDialogState({
      isOpen: true,
      action
    });
  };

  const handleDialogClose = () => {
    setDialogState({
      isOpen: false,
      action: null
    });
  };

  const handleDialogConfirm = (reason?: string, notes?: string) => {
    if (dialogState.action) {
      onBulkAction(dialogState.action, reason, notes);
    }
    handleDialogClose();
  };

  if (selectedUsers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-muted/50 border rounded-lg">
        <div className="flex items-center space-x-3">
          <Badge variant="secondary">
            {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                <span>Bulk Actions</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleActionClick('activate')}>
                <UserCheck className="mr-2 h-4 w-4" />
                Activate Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleActionClick('suspend')}>
                <UserX className="mr-2 h-4 w-4" />
                Suspend Users
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleActionClick('delete')}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Users
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <BulkActionDialog
        isOpen={dialogState.isOpen}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
        action={dialogState.action}
        userCount={selectedUsers.length}
        isLoading={isLoading}
      />
    </>
  );
};