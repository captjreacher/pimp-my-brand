import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  User, 
  Calendar, 
  Flag, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ArrowUp,
  FileText,
  Briefcase
} from 'lucide-react';
import { ModerationQueueItem, ModerationStatus, FlagReason } from '@/lib/admin/moderation-service';
import { ContentPreview as ContentPreviewType } from '@/lib/admin/api/content-moderation-api';
import { formatDistanceToNow } from 'date-fns';

interface ContentPreviewProps {
  item: ModerationQueueItem;
  preview: ContentPreviewType | null;
  flagReasons: FlagReason[];
  loading: boolean;
  open: boolean;
  onClose: () => void;
  onModerate: (queueId: string, status: ModerationStatus, notes?: string) => Promise<boolean>;
  onEscalate: (queueId: string, reason: string) => Promise<boolean>;
}

export function ContentPreview({
  item,
  preview,
  flagReasons,
  loading,
  open,
  onClose,
  onModerate,
  onEscalate
}: ContentPreviewProps) {
  const [moderationStatus, setModerationStatus] = useState<ModerationStatus>('approved');
  const [moderationNotes, setModerationNotes] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setModerationStatus('approved');
      setModerationNotes('');
      setEscalationReason('');
    }
  }, [open]);

  const handleModerate = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const success = await onModerate(item.id, moderationStatus, moderationNotes || undefined);
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (isSubmitting || !escalationReason.trim()) return;
    
    setIsSubmitting(true);
    try {
      const success = await onEscalate(item.id, escalationReason);
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'text-red-600 bg-red-50';
    if (priority >= 4) return 'text-orange-600 bg-orange-50';
    if (priority >= 3) return 'text-yellow-600 bg-yellow-50';
    if (priority >= 2) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    if (score >= 20) return 'text-blue-600 bg-blue-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'escalated':
        return <ArrowUp className="h-4 w-4 text-orange-600" />;
      default:
        return <Flag className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item.content_type === 'brand' ? (
              <Briefcase className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
            Content Review - {item.content_type.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Content Preview */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-20 bg-muted animate-pulse rounded" />
                  </div>
                ) : preview ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Title</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {preview.title || 'No title'}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Content</Label>
                      <ScrollArea className="h-40 w-full border rounded-md p-3 mt-1">
                        <p className="text-sm whitespace-pre-wrap">
                          {preview.content || 'No content available'}
                        </p>
                      </ScrollArea>
                    </div>

                    {preview.metadata && (
                      <div>
                        <Label className="text-sm font-medium">Metadata</Label>
                        <ScrollArea className="h-20 w-full border rounded-md p-3 mt-1">
                          <pre className="text-xs text-muted-foreground">
                            {JSON.stringify(preview.metadata, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>Content preview not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Moderation Panel */}
          <div className="space-y-4">
            {/* Item Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(item.status)}
                    <Badge variant="outline" className="capitalize">
                      {item.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Priority</span>
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority}/5
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Score</span>
                  <Badge className={getRiskScoreColor(item.risk_score)}>
                    {item.risk_score}/100
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto Flagged</span>
                  <Badge variant={item.auto_flagged ? "destructive" : "secondary"}>
                    {item.auto_flagged ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>{preview?.userInfo?.email || item.user_email || 'Unknown user'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Flagged {formatDistanceToNow(new Date(item.created_at))} ago</span>
                  </div>

                  {item.flag_reason && (
                    <div className="flex items-start gap-2 text-sm">
                      <Flag className="h-4 w-4 mt-0.5" />
                      <span className="text-muted-foreground">{item.flag_reason}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Moderation Actions */}
            {item.status === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Moderation Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Decision</Label>
                    <Select value={moderationStatus} onValueChange={(value) => setModerationStatus(value as ModerationStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approve</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add moderation notes..."
                      value={moderationNotes}
                      onChange={(e) => setModerationNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleModerate}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? 'Processing...' : `${moderationStatus === 'approved' ? 'Approve' : 'Reject'} Content`}
                  </Button>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="escalation">Escalation Reason</Label>
                    <Textarea
                      id="escalation"
                      placeholder="Reason for escalation..."
                      value={escalationReason}
                      onChange={(e) => setEscalationReason(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleEscalate}
                    disabled={isSubmitting || !escalationReason.trim()}
                    className="w-full"
                  >
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Escalate to Admin
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}