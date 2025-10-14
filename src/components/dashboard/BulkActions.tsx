import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ChevronDown, 
  Trash2, 
  Copy, 
  Download, 
  Share, 
  Archive,
  Tag,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkActionsProps {
  selectedItems: string[];
  totalItems: number;
  contentType: 'brands' | 'cvs' | 'uploads';
  onSelectAll: (selected: boolean) => void;
  onClearSelection: () => void;
  onBulkAction: (action: string, itemIds: string[]) => Promise<void>;
}

export function BulkActions({
  selectedItems,
  totalItems,
  contentType,
  onSelectAll,
  onClearSelection,
  onBulkAction,
}: BulkActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isAllSelected = selectedItems.length === totalItems && totalItems > 0;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < totalItems;

  const handleBulkAction = async (action: string) => {
    if (selectedItems.length === 0) return;

    if (action === 'delete') {
      setShowDeleteDialog(true);
      return;
    }

    setIsProcessing(true);
    try {
      await onBulkAction(action, selectedItems);
      
      const actionLabels = {
        duplicate: 'duplicated',
        export: 'exported',
        share: 'shared',
        archive: 'archived',
        makePublic: 'made public',
        makePrivate: 'made private',
        addTag: 'tagged',
      };

      toast.success(`${selectedItems.length} ${contentType} ${actionLabels[action as keyof typeof actionLabels] || 'processed'} successfully`);
      onClearSelection();
    } catch (error) {
      toast.error(`Failed to process ${contentType}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await onBulkAction('delete', selectedItems);
      toast.success(`${selectedItems.length} ${contentType} deleted successfully`);
      onClearSelection();
    } catch (error) {
      toast.error(`Failed to delete ${contentType}. Please try again.`);
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
    }
  };

  const getBulkActions = () => {
    const actions = [
      { key: 'duplicate', label: 'Duplicate', icon: Copy, destructive: false },
      { key: 'export', label: 'Export All', icon: Download, destructive: false },
    ];

    if (contentType !== 'uploads') {
      actions.push(
        { key: 'share', label: 'Share All', icon: Share, destructive: false },
        { key: 'makePublic', label: 'Make Public', icon: Eye, destructive: false },
        { key: 'makePrivate', label: 'Make Private', icon: EyeOff, destructive: false },
        { key: 'addTag', label: 'Add Tag', icon: Tag, destructive: false }
      );
    }

    actions.push(
      { key: 'archive', label: 'Archive', icon: Archive, destructive: false },
      { key: 'delete', label: 'Delete', icon: Trash2, destructive: true }
    );

    return actions;
  };

  if (totalItems === 0) return null;

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => onSelectAll(!!checked)}
            />
            <span className="text-sm font-medium">
              {selectedItems.length > 0 ? (
                <>
                  {selectedItems.length} of {totalItems} selected
                </>
              ) : (
                `Select all ${totalItems} ${contentType}`
              )}
            </span>
          </div>

          {selectedItems.length > 0 && (
            <Badge variant="secondary">
              {selectedItems.length} selected
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedItems.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearSelection}
                disabled={isProcessing}
              >
                Clear Selection
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    Bulk Actions
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {getBulkActions().map((action, index) => (
                    <div key={action.key}>
                      {action.destructive && index > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onClick={() => handleBulkAction(action.key)}
                        className={action.destructive ? 'text-destructive' : ''}
                        disabled={isProcessing}
                      >
                        <action.icon className="w-4 h-4 mr-2" />
                        {action.label}
                      </DropdownMenuItem>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.length} {contentType}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected {contentType} and remove them from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}