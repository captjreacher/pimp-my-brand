import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { useAdminTheme } from './AdminThemeProvider';
import { useAdminPerformance } from '@/hooks/use-admin-performance';
import { useAdminOnboarding } from './AdminOnboarding';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import { AdminSearchInput } from './AdminSearch';
import { QuickActions } from './QuickActions';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Bell,
  Settings,
  User,
  LogOut,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  ExternalLink,
  Moon,
  Sun,
  Activity,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface AdminNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Mock notifications - in real app, these would come from an API
const mockNotifications: AdminNotification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'High Content Queue',
    message: '12 items pending moderation review',
    timestamp: '5 minutes ago',
    read: false,
    actionUrl: '/admin/moderation',
  },
  {
    id: '2',
    type: 'info',
    title: 'System Update',
    message: 'Scheduled maintenance in 2 hours',
    timestamp: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Backup Completed',
    message: 'Daily database backup successful',
    timestamp: '3 hours ago',
    read: true,
  },
];

export function AdminHeader() {
  const { user, logout } = useAdmin();
  const { isDarkMode, toggleDarkMode } = useAdminTheme();
  const { metrics } = useAdminPerformance();
  const { startOnboarding, isCompleted } = useAdminOnboarding();
  const [notifications] = useState<AdminNotification[]>(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getNotificationIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-500';
    if (value <= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };



  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Sidebar Toggle */}
        <SidebarTrigger />

        {/* Breadcrumbs */}
        <AdminBreadcrumbs className="hidden md:flex" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Performance Indicator */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Activity className="h-4 w-4" />
                <div className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${
                  metrics.apiResponseTime < 500 ? 'bg-green-500' : 
                  metrics.apiResponseTime < 1000 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <div>API Response: {Math.round(metrics.apiResponseTime)}ms</div>
                <div>Render Time: {metrics.renderTime}ms</div>
                {metrics.memoryUsage > 0 && (
                  <div>Memory: {Math.round(metrics.memoryUsage)}MB</div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Theme Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Switch to {isDarkMode ? 'light' : 'dark'} mode
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Help/Onboarding */}
        {!isCompleted && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={startOnboarding}>
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Start admin onboarding
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Quick Actions */}
        <QuickActions />

        {/* Search */}
        <AdminSearchInput className="hidden sm:block" />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {unreadCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start gap-2 p-4 ${
                      !notification.read ? 'bg-muted/50' : ''
                    }`}
                    asChild={!!notification.actionUrl}
                  >
                    {notification.actionUrl ? (
                      <Link to={notification.actionUrl} className="w-full">
                        <div className="flex items-start gap-2">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {notification.title}
                              </span>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {notification.timestamp}
                              </span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-start gap-2 w-full">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {notification.title}
                            </span>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {notification.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/notifications" className="w-full text-center">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.email || 'Admin User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.app_role.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}