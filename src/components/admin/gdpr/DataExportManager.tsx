import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Download,
  FileText,
  Calendar as CalendarIcon,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { GDPRComplianceService, type DataExportRequest } from '@/lib/admin/gdpr-service';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DataExportManagerProps {
  userId?: string; // If provided, show exports for specific user
}

export function DataExportManager({ userId }: DataExportManagerProps) {
  const [exports, setExports] = useState<DataExportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create export form state
  const [targetUserId, setTargetUserId] = useState(userId || '');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xml'>('json');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState<Date>();
  const [dateRangeEnd, setDateRangeEnd] = useState<Date>();
  const [isCreating, setIsCreating] = useState(false);

  const gdprService = GDPRComplianceService.getInstance();

  useEffect(() => {
    loadExports();
  }, [userId]);

  const loadExports = async () => {
    try {
      setIsLoading(true);
      const data = await gdprService.getDataExportRequests(userId);
      setExports(data);
    } catch (error) {
      console.error('Failed to load exports:', error);
      toast.error('Failed to load data exports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExport = async () => {
    if (!targetUserId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    try {
      setIsCreating(true);
      
      await gdprService.createDataExport(targetUserId, {
        format: exportFormat,
        includeDeleted,
        dateRangeStart,
        dateRangeEnd
      });

      toast.success('Data export request created successfully');
      setShowCreateDialog(false);
      resetForm();
      await loadExports();
    } catch (error) {
      toast.error('Failed to create data export request');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setTargetUserId(userId || '');
    setExportFormat('json');
    setIncludeDeleted(false);
    setDateRangeStart(undefined);
    setDateRangeEnd(undefined);
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

  const filteredExports = exports.filter(exportReq => {
    const matchesSearch = !searchTerm || 
      exportReq.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || exportReq.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

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
                <Download className="h-4 w-4" />
                Data Export Manager
              </CardTitle>
              <CardDescription>
                Manage GDPR-compliant user data exports
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Export
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Data Export</DialogTitle>
                    <DialogDescription>
                      Generate a GDPR-compliant data export for a user
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
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
                      <Label>Export Format</Label>
                      <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xml">XML</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include-deleted"
                        checked={includeDeleted}
                        onCheckedChange={setIncludeDeleted}
                      />
                      <Label htmlFor="include-deleted">Include deleted data</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Start Date (Optional)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRangeStart && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRangeStart ? format(dateRangeStart, "PPP") : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dateRangeStart}
                              onSelect={setDateRangeStart}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>End Date (Optional)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRangeEnd && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRangeEnd ? format(dateRangeEnd, "PPP") : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dateRangeEnd}
                              onSelect={setDateRangeEnd}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateExport} disabled={isCreating}>
                      {isCreating ? 'Creating...' : 'Create Export'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={loadExports}>
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

          {filteredExports.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No data export requests found matching your criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExports.map((exportReq) => (
                    <TableRow key={exportReq.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(exportReq.status)}
                          {getStatusBadge(exportReq.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{exportReq.user_id}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{exportReq.export_format.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(exportReq.export_file_size)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(exportReq.created_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {exportReq.expires_at && (
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(exportReq.expires_at), { addSuffix: true })}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {exportReq.status === 'completed' && exportReq.export_file_path && (
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        )}
                        {exportReq.status === 'failed' && exportReq.error_message && (
                          <Button size="sm" variant="ghost" title={exportReq.error_message}>
                            <AlertTriangle className="h-3 w-3" />
                          </Button>
                        )}
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