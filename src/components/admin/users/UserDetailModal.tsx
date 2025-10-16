import React from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User,
  Mail,
  Calendar,
  Shield,
  CreditCard,
  FileText,
  Activity,
  Clock,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { type UserAdminSummary } from '@/lib/admin/user-management-service';

interface UserDetailModalProps {
  user: UserAdminSummary | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  } catch {
    return 'Invalid date';
  }
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

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'destructive';
    case 'admin':
      return 'default';
    case 'moderator':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Loading User Details...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-muted rounded-full" />
                <div className="space-y-2">
                  <div className="h-6 bg-muted rounded w-48" />
                  <div className="h-4 bg-muted rounded w-32" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded" />
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return null;
  }

  const recentActivity = user.recent_activity || {};
  const recentBrands = recentActivity.recent_brands || [];
  const recentCvs = recentActivity.recent_cvs || [];
  const recentSessions = recentActivity.recent_logins || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 p-1">
            {/* User Header */}
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {getInitials(user.full_name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-semibold">
                    {user.full_name || 'Unnamed User'}
                  </h3>
                  <Badge variant={getRoleBadgeVariant(user.app_role)}>
                    {user.app_role.replace('_', ' ')}
                  </Badge>
                  {user.is_suspended && (
                    <Badge variant="destructive">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Suspended
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(user.created_at)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Content</p>
                      <p className="text-2xl font-bold">{user.content_count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Generations</p>
                      <p className="text-2xl font-bold">{user.total_generations}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Brands</p>
                      <p className="text-2xl font-bold">{user.total_brands}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">CVs</p>
                      <p className="text-2xl font-bold">{user.total_cvs}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Information */}
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Profile Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-sm">{user.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <p className="text-sm">{user.full_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Role</label>
                        <p className="text-sm">
                          <Badge variant={getRoleBadgeVariant(user.app_role)}>
                            {user.app_role.replace('_', ' ')}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Subscription</label>
                        <p className="text-sm">
                          <Badge variant="outline">
                            {user.subscription_tier || 'Free'}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                        <p className="text-sm">{formatDate(user.created_at)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Sign In</label>
                        <p className="text-sm">{formatDate(user.last_sign_in)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Recent Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentSessions.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="font-medium">Recent Sessions</h4>
                        {recentSessions.slice(0, 5).map((session: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{formatDate(session.session_start)}</span>
                            </div>
                            {session.ip_address && (
                              <div className="flex items-center space-x-1 text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="text-xs">{session.ip_address}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Brands</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentBrands.length > 0 ? (
                        <div className="space-y-2">
                          {recentBrands.map((brand: any) => (
                            <div key={brand.id} className="flex justify-between items-center text-sm">
                              <span className="truncate">{brand.title}</span>
                              <span className="text-muted-foreground text-xs">
                                {formatDate(brand.created_at)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No recent brands</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent CVs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentCvs.length > 0 ? (
                        <div className="space-y-2">
                          {recentCvs.map((cv: any) => (
                            <div key={cv.id} className="flex justify-between items-center text-sm">
                              <span className="truncate">{cv.title}</span>
                              <span className="text-muted-foreground text-xs">
                                {formatDate(cv.created_at)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No recent CVs</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Administrative Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {user.is_suspended && (
                      <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                        <div className="flex items-center space-x-2 text-destructive mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Account Suspended</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p><strong>Suspended:</strong> {formatDate(user.suspended_at)}</p>
                          <p><strong>Reason:</strong> {user.suspension_reason || 'No reason provided'}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Admin Action</label>
                        <p className="text-sm">{user.last_admin_action || 'None'}</p>
                      </div>
                      
                      {user.admin_notes && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Admin Notes</label>
                          <div className="mt-1 p-3 bg-muted rounded-md">
                            <pre className="text-sm whitespace-pre-wrap">{user.admin_notes}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};