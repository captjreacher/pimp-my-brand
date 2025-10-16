import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Trash2,
  UserX,
  Calendar as CalendarIcon,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Shield
} from 'lucide-react';
import { GDPRComplianceService, type DataDeletionRequest } from '@/lib/admin/gdpr-service';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DataDeletionManagerProps {
  userId?: string; // If provided, show deletions for specific user
}

export function DataDeletionManager({ userId }: DataDeletionManagerProps) {
  const [deletions, setDeletions] = useState<DataDeletionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create deletion form state
  const [targetUserId, setTargetUserId] = useState(userId || '');
  const [deletionType, setDeletionType] = useState<'soft_delete' | 'hard_delete' | 'anonymize'>('soft_delete');
  const [preserveAuditTrail, setPreserveAuditTrail] = useState(true);
  const [preserveAnalytics, setPreserveAnalytics] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [scheduledFor, setScheduledFor] = useState<Date>();
  const [isCreating, setIsCreating] = useState(false);

  const gdprService = GDPRComplianceService.getInstance();

  useEffect(() => {
    loadDeletions();
  }, [userId]);

  const loadDeletions = async () => {
    try {
      setIsLoading(true);
      const data = await gdprService.getDataDeletionRequests(userId);
      setDeletions(data);
    } catch (error) {
      console.error('Failed to load deletions:', error);
      toast.error('Failed to load data deletion requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeletion = async () => {
    if (!targetUserId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    if (!deletionReason.trim()) {
      toast.error('Please provide a reason for deletion');
      return;
    }

    try {
      setIsCreating(true);
      
      await gdprService.createDataDeletion(targetUserId, {
        deletionType,
        preserveAuditTrail,
        preserveAnalytics,
        reason: deletionReason,
        scheduledFor
      });

      toast.success('Data deletion request created successfully');
      setShowCreateDialog(false);
      resetForm();
      await loadDeletions();
    } catch (error) {
      toast.error('Failed to create data deletion request');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setTargetUserId(userId || '');
    setDeletionType('soft_delete');
    setPreserveAuditTrail(true);
    setPreserveAnalytics(false);
    setDeletionReason('');
    setScheduledFor(undefined);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getDeletionTypeBadge = (type: string) => {
    const variants = {
      soft_delete: 'secondary',
      hard_delete: 'destructive',
      anonymize: 'default'
    } as const;

    const labels = {
      soft_delete: 'Soft Delete',
      hard_delete: 'Hard Delete',
      anonymize: 'Anonymize'
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'secondary'}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  const filteredDeletions = deletions.filter(deletion => {
    const matchesSearch = !searchTerm || 
      deletion.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || deletion.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-4 w-4" />
                Data Deletion Manager
              </CardTitle>
              <CardDescription>
                Manage GDPR right to be forgotten requests
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Create Deletion Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Data Deletion Request</DialogTitle>
                    <DialogDescription>
                      Process a GDPR right to be forgotten request
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This action will permanently affect user data. Proceed with caution.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="user-id">User ID</Label>
                      <Input
                        id="user-id"
                        placeholder="Enter user ID"
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                        disabled={!!userId} // Disable if userId is provided as prop
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Deletion Type</Label>
                      <Select value={deletionType} onValueChange={(value: any) => setDeletionType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soft_delete">Soft Delete (Deactivate)</SelectItem>
                          <SelectItem value="anonymize">Anonymize Data</SelectItem>
                          <SelectItem value="hard_delete">Hard Delete (Permanent)</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-muted-foreground">
                        {deletionType === 'soft_delete' && 'User account will be deactivated but data preserved'}
                        {deletionType === 'anonymize' && 'Personal data will be anonymized while preserving analytics'}
                        {deletionType === 'hard_delete' && 'All user data will be permanently deleted'}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="preserve-audit"
                          checked={preserveAuditTrail}
                          onCheckedChange={setPreserveAuditTrail}
                        />
                        <Label htmlFor="preserve-audit">Preserve audit trail</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="preserve-analytics"
                          checked={preserveAnalytics}
                          onCheckedChange={setPreserveAnalytics}
                        />
                        <Label htmlFor="preserve-analytics">Preserve analytics data</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason">Deletion Reason</Label>
                      <Textarea
                        id="reason"
                        placeholder="Enter reason for deletion request..."
                        value={deletionReason}
                        onChange={(e) => setDeletionReason(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Schedule For (Optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !scheduledFor && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledFor ? format(scheduledFor, "PPP") : "Execute immediately"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduledFor}
                            onSelect={setScheduledFor}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleCreateDeletion} 
                      disabled={isCreating}
                    >
                      {isCreating ? 'Creating...' : 'Create Request'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={loadDeletions}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredDeletions.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No data deletion requests found matching your criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Preservation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeletions.map((deletion) => (
                    <TableRow key={deletion.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(deletion.status)}
                          {getStatusBadge(deletion.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{deletion.user_id}</code>
                      </TableCell>
                      <TableCell>
                        {getDeletionTypeBadge(deletion.deletion_type)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm" title={deletion.deletion_reason || ''}>
                          {deletion.deletion_reason || 'No reason provided'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {deletion.scheduled_for ? (
                          <span className="text-sm">
                            {format(new Date(deletion.scheduled_for), "PPP")}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Immediate</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(deletion.created_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {deletion.preserve_audit_trail && (
                            <Badge variant="outline" size="sm" title="Audit trail preserved">
                              <Shield className="h-3 w-3" />
                            </Badge>
                          )}
                          {deletion.preserve_analytics && (
                            <Badge variant="outline" size="sm" title="Analytics preserved">
                              A
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}