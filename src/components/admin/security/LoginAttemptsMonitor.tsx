import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Lock,
  Unlock
} from 'lucide-react';
import { EnhancedAdminSecurityService, type LoginAttempt, type SecurityMetrics } from '@/lib/admin/enhanced-security-service';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface LoginAttemptsMonitorProps {
  userId?: string; // If provided, show attempts for specific user
  showMetrics?: boolean;
}

export function LoginAttemptsMonitor({ userId, showMetrics = true }: LoginAttemptsMonitorProps) {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');

  const securityService = EnhancedAdminSecurityService.getInstance();

  useEffect(() => {
    loadData();
  }, [userId, timeframe]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      if (userId) {
        const attemptsData = await securityService.getLoginAttempts(userId);
        setAttempts(attemptsData);
      }
      
      if (showMetrics) {
        const metricsData = await securityService.getSecurityMetrics(timeframe);
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Failed to load security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockAccount = async (targetUserId: string) => {
    try {
      await securityService.unlockAccount(targetUserId);
      toast.success('Account unlocked successfully');
      await loadData();
    } catch (error) {
      toast.error('Failed to unlock account');
    }
  };

  const filteredAttempts = attempts.filter(attempt => {
    const matchesSearch = !searchTerm || 
      attempt.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.ip_address.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'success' && attempt.success) ||
      (statusFilter === 'failed' && !attempt.success);
    
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
      {showMetrics && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{metrics.total_login_attempts}</div>
              <div className="text-sm text-muted-foreground">Total Attempts</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{metrics.failed_attempts}</div>
              <div className="text-sm text-muted-foreground">Failed Attempts</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {metrics.success_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{metrics.locked_accounts}</div>
              <div className="text-sm text-muted-foreground">Locked Accounts</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{metrics.mfa_enabled_users}</div>
              <div className="text-sm text-muted-foreground">MFA Enabled</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{metrics.ip_restricted_users}</div>
              <div className="text-sm text-muted-foreground">IP Restricted</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Login Attempts Monitor
              </CardTitle>
              <CardDescription>
                Track and monitor admin login attempts for security analysis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {showMetrics && (
                <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Last Day</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" size="sm" onClick={loadData}>
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
                  placeholder="Search by email or IP address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredAttempts.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No login attempts found matching your criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>MFA</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {attempt.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <Badge variant={attempt.success ? 'default' : 'destructive'}>
                            {attempt.success ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{attempt.email}</TableCell>
                      <TableCell>
                        <code className="text-sm">{attempt.ip_address}</code>
                      </TableCell>
                      <TableCell>
                        {attempt.mfa_required ? (
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            <Badge variant={attempt.mfa_success ? 'default' : 'destructive'} size="sm">
                              {attempt.mfa_success ? 'Verified' : 'Failed'}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not required</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(attempt.created_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {attempt.failure_reason && (
                          <Badge variant="outline" className="text-xs">
                            {attempt.failure_reason}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!attempt.success && attempt.failure_reason === 'Account locked' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnlockAccount(attempt.user_id)}
                          >
                            <Unlock className="h-3 w-3 mr-1" />
                            Unlock
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