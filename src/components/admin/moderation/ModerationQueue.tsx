import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Eye, CheckCircle, XCircle, Clock, User, Calendar, Flag, RefreshCw, Loader2, FileText, Briefcase } from 'lucide-react';
import { ModerationQueueItem, ModerationStatus, ContentType, FlagReason } from '@/lib/admin/moderation-service';
import { ContentPreview as ContentPreviewType, BulkModerationRequest } from '@/lib/admin/api/content-moderation-api';
import { ContentPreview } from './ContentPreview';
import { BulkModerationActions } from './BulkModerationActions';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ModerationQueueProps {
  items: ModerationQueueItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onModerate: (queueId: string, status: ModerationStatus, notes?: string) => Promise<boolean>;
  onBulkModerate: (request: BulkModerationRequest) => Promise<boolean>;
  onEscalate: (queueId: string, reason: string) => Promise<boolean>;
  onGetPreview: (contentType: ContentType, contentId: string) => Promise<ContentPreviewType | null>;
  flagReasons: FlagReason[];}

export function ModerationQueue({
  items,
  loading,
  error,
  hasMore,
  onLoadMore,
  onRefresh,
  onModerate,
  onBulkModerate,
  onEscalate,
  onGetPreview,
  flagReasons
}: ModerationQueueProps) {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<ModerationQueueItem | null>(null);
  const [previewContent, setPreviewContent] = useState<ContentPreviewType | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'priority' | 'risk_score'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sort items based on current sort settings
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [items, sortBy, sortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(sortedItems.filter(item => item.status === 'pending').map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handlePreview = async (item: ModerationQueueItem) => {
    setPreviewItem(item);
    setPreviewLoading(true);
    setPreviewContent(null);

    try {
      const content = await onGetPreview(item.content_type as ContentType, item.content_id);
      setPreviewContent(content);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load content preview",
        variant: "destructive"
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewItem(null);
    setPreviewContent(null);
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'bg-red-100 text-red-800 border-red-200';
    if (priority >= 4) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (priority >= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (priority >= 2) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'bg-red-100 text-red-800';
    if (score >= 60) return 'bg-orange-100 text-orange-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    if (score >= 20) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'escalated':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getContentTypeIcon = (type: string) => {
    return type === 'brand' ? (
      <Briefcase className="h-4 w-4" />
    ) : (
      <FileText className="h-4 w-4" />
    );
  };

  const pendingItems = sortedItems.filter(item => item.status === 'pending');
  const allPendingSelected = pendingItems.length > 0 && pendingItems.every(item => selectedItems.includes(item.id));
  const somePendingSelected = pendingItems.some(item => selectedItems.includes(item.id));

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Queue</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">
            {items.length} items
          </h3>
          
          {pendingItems.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allPendingSelected}
                onCheckedChange={handleSelectAll}
                className={somePendingSelected && !allPendingSelected ? 'data-[state=checked]:bg-blue-600' : ''}
              />
              <span className="text-sm text-muted-foreground">
                Select all pending ({pendingItems.length})
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as typeof sortBy);
              setSortOrder(order as typeof sortOrder);
            }}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="priority-desc">High Priority First</option>
            <option value="priority-asc">Low Priority First</option>
            <option value="risk_score-desc">High Risk First</option>
            <option value="risk_score-asc">Low Risk First</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Queue Table */}
      <ScrollArea className="h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allPendingSelected}
                  onCheckedChange={handleSelectAll}
                  className={somePendingSelected && !allPendingSelected ? 'data-[state=checked]:bg-blue-600' : ''}
                />
              </TableHead>
              <TableHead>Content</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Flagged</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => (
              <TableRow key={item.id} className={selectedItems.includes(item.id) ? 'bg-blue-50' : ''}>
                <TableCell>
                  {item.status === 'pending' && (
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    />
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getContentTypeIcon(item.content_type)}
                    <div>
                      <div className="font-medium capitalize">
                        {item.content_type}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {item.content_id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm">
                        {item.user_email || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.user_id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <Badge variant="outline" className="capitalize">
                      {item.status}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority}/5
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge className={getRiskScoreColor(item.risk_score)}>
                    {item.risk_score}%
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(item.created_at))} ago
                    </div>
                    {item.flag_reason && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Flag className="h-3 w-3" />
                        {item.flag_reason.length > 20 
                          ? `${item.flag_reason.slice(0, 20)}...` 
                          : item.flag_reason
                        }
                      </div>
                    )}
                    {item.auto_flagged && (
                      <Badge variant="secondary" className="text-xs">
                        Auto
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(item)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading moderation queue...</span>
          </div>
        )}

        {!loading && sortedItems.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="h-8 w-8 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
            <p className="text-muted-foreground">No items in the moderation queue</p>
          </div>
        )}

        {!loading && hasMore && (
          <div className="flex justify-center py-4">
            <Button variant="outline" onClick={onLoadMore}>
              Load More
            </Button>
          </div>
        )}
      </ScrollArea>

      {/* Content Preview Dialog */}
      {previewItem && (
        <ContentPreview
          item={previewItem}
          preview={previewContent}
          flagReasons={flagReasons}
          loading={previewLoading}
          open={!!previewItem}
          onClose={handleClosePreview}
          onModerate={onModerate}
          onEscalate={onEscalate}
        />
      )}

      {/* Bulk Actions */}
      <BulkModerationActions
        selectedItems={selectedItems}
        onBulkModerate={onBulkModerate}
        onClearSelection={() => setSelectedItems([])}
      />
    </div>
  );
}