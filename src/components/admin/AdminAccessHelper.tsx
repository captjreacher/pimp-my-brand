import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/hooks/use-admin-session';
import { Shield, Users, BarChart3, Settings, MessageSquare, Lock, AlertTriangle } from 'lucide-react';

export function AdminAccessHelper() {
  const navigate = useNavigate();
  const { user, isAdmin, permissions } = useAdminAuth();

  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Please sign in to access admin functions.
          </p>
          <Button onClick={() => navigate('/auth')} className="w-full">
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              You don't have admin permissions. Current role: 
              <Badge variant="secondary" className="ml-2">
                {user.app_role || 'user'}
              </Badge>
            </p>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">To get admin access:</p>
                  <ol className="mt-2 text-yellow-700 list-decimal list-inside space-y-1">
                    <li>Run the database migrations</li>
                    <li>Execute the setup-admin.sql script with your email</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const adminPages = [
    {
      title: 'Dashboard',
      description: 'Overview and system metrics',
      path: '/admin',
      icon: BarChart3,
      permission: 'view_analytics'
    },
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      path: '/admin/users',
      icon: Users,
      permission: 'manage_users'
    },
    {
      title: 'Communication',
      description: 'Messages, announcements, support',
      path: '/admin/communication',
      icon: MessageSquare,
      permission: 'manage_users'
    },
    {
      title: 'Analytics',
      description: 'Detailed analytics and reports',
      path: '/admin/analytics',
      icon: BarChart3,
      permission: 'view_analytics'
    },
    {
      title: 'System Config',
      description: 'System configuration and settings',
      path: '/admin/config',
      icon: Settings,
      permission: 'manage_system'
    },
    {
      title: 'Security',
      description: 'Security settings and monitoring',
      path: '/admin/security',
      icon: Shield,
      permission: 'manage_system'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Panel Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div>
              <p className="font-medium">{user.email}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant="default">
              {user.app_role || 'user'}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            You have access to the following admin functions:
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminPages.map((page) => {
          const hasPermission = Array.isArray(permissions) && permissions.includes(page.permission);
          const Icon = page.icon;
          
          return (
            <Card 
              key={page.path} 
              className={`cursor-pointer transition-colors ${
                hasPermission 
                  ? 'hover:bg-muted/50' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => hasPermission && navigate(page.path)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5" />
                  {page.title}
                  {!hasPermission && <Lock className="h-4 w-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {page.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}