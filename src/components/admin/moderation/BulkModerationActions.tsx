import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, ArrowUp, Users, AlertTriangle } from 'lucide-react';
import { ModerationStatus } from '@/lib/admin/moderation-service';
import { BulkModerationRequest } from '@/lib/admin/api/content-moderation-api';

interface BulkModerationActionsProps {
  selectedItems: string[];
  onBulkModerate: (request: BulkModerationRequest) => Promise<boolean>;
  onClearSelection: () => void;
}

export function BulkModerationActions({
  selectedItems,
  onBulkModerate,
  onClearSelection
}: BulkModerationActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<ModerationStatus>('approved');
  const [bulkNotes, setBulkNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBulkModerate = async () => {
    if (isSubmitting || selectedItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const success = await onBulkModerate({
        queueIds: selectedItems,
        status: bulkStatus,
        moderatorNotes: bulkNotes || undefined
      });

      if (success) {
        setIsOpen(false);
        setBulkNotes('');
        onClearSelection();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: ModerationStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'escalated':
        return <ArrowUp className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: ModerationStatus) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'escalated':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[400px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {selectedItems.length} selected
            </Badge>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkStatus('approved')}
                className={bulkStatus === 'approved' ? getStatusColor('approved') : ''}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve All
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkStatus('rejected')}
                className={bulkStatus === 'rejected' ? getStatusColor('rejected') : ''}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject All
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  Process Selected
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Bulk Moderation
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      You are about to moderate {selectedItems.length} items
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bulkStatus">Action</Label>
                    <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as ModerationStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Approve All
                          </div>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Reject All
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bulkNotes">Notes (Optional)</Label>
                    <Textarea
                      id="bulkNotes"
                      placeholder="Add notes for all selected items..."
                      value={bulkNotes}
                      onChange={(e) => setBulkNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      This action cannot be undone
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleBulkModerate}
                        disabled={isSubmitting}
                        className={getStatusColor(bulkStatus)}
                      >
                        {isSubmitting ? 'Processing...' : (
                          <div className="flex items-center gap-2">
                            {getStatusIcon(bulkStatus)}
                            {bulkStatus === 'approved' ? 'Approve' : 'Reject'} {selectedItems.length} Items
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}