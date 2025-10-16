import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Plus,
  Users,
  Flag,
  CreditCard,
  BarChart3,
  Settings,
  Search,
  Bell,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import type { AdminPermission } from '@/lib/admin/types';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  requiredPermissions?: AdminPermission[];
  badge?: string | number;
  shortcut?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

export function QuickActions() {
  const { checkPermission } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);

  // Define available quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'create-user',
      label: 'Create User',
      description: 'Add a new user to the system',
      icon: Plus,
      href: '/admin/users/create',
      requiredPermissions: ['manage_users'],
      shortcut: 'Ctrl+N',
    },
    {
      id: 'moderation-queue',
      label: 'Moderation Queue',
      description: 'Review pending content',
      icon: Flag,
      href: '/admin/moderation',
      requiredPermissions: ['moderate_content'],
      badge: '12', // This would come from real data
      shortcut: 'Ctrl+M',
    },
    {
      id: 'user-search',
      label: 'Search Users',
      description: 'Find and manage users',
      icon: Search,
      href: '/admin/users?search=true',
      requiredPermissions: ['manage_users'],
      shortcut: 'Ctrl+F',
    },
    {
      id: 'system-health',
      label: 'System Health',
      description: 'Check system status',
      icon: BarChart3,
      href: '/admin/system',
      requiredPermissions: ['manage_system'],
      shortcut: 'Ctrl+H',
    },
    {
      id: 'export-data',
      label: 'Export Data',
      description: 'Download system reports',
      icon: Download,
      onClick: () => handleExportData(),
      requiredPermissions: ['view_analytics'],
      shortcut: 'Ctrl+E',
    },
    {
      id: 'refresh-cache',
      label: 'Refresh Cache',
      description: 'Clear system cache',
      icon: RefreshCw,
      onClick: () => handleRefreshCache(),
      requiredPermissions: ['manage_system'],
      variant: 'outline',
    },
    {
      id: 'billing-issues',
      label: 'Billing Issues',
      description: 'Handle payment problems',
      icon: AlertTriangle,
      href: '/admin/subscriptions?filter=issues',
      requiredPermissions: ['manage_billing'],
      badge: '3',
      variant: 'destructive',
    },
    {
      id: 'notifications',
      label: 'Send Notification',
      description: 'Broadcast to all users',
      icon: Bell,
      href: '/admin/notifications/create',
      requiredPermissions: ['manage_system'],
      variant: 'secondary',
    },
  ];

  // Filter actions based on permissions
  const availableActions = quickActions.filter(action => 
    !action.requiredPermissions || 
    action.requiredPermissions.every(permission => checkPermission(permission))
  );

  const handleExportData = () => {
    // In a real app, this would trigger a data export
    console.log('Exporting data...');
    setIsOpen(false);
  };

  const handleRefreshCache = () => {
    // In a real app, this would refresh the cache
    console.log('Refreshing cache...');
    setIsOpen(false);
  };

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    }
    setIsOpen(false);
  };

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Zap className="h-4 w-4" />
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {availableActions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            className="flex items-center gap-2 p-3"
            asChild={!!action.href}
          >
            {action.href ? (
              <Link to={action.href} className="flex items-center gap-2 w-full">
                <action.icon className="h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{action.label}</span>
                    {action.badge && (
                      <Badge 
                        variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
                        className="text-xs h-4 px-1"
                      >
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {action.description}
                  </p>
                </div>
                {action.shortcut && (
                  <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
                )}
              </Link>
            ) : (
              <button
                onClick={() => handleActionClick(action)}
                className="flex items-center gap-2 w-full text-left"
              >
                <action.icon className="h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{action.label}</span>
                    {action.badge && (
                      <Badge 
                        variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
                        className="text-xs h-4 px-1"
                      >
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {action.description}
                  </p>
                </div>
                {action.shortcut && (
                  <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
                )}
              </button>
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/admin/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Admin Settings</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Keyboard shortcut handler hook
export function useAdminShortcuts() {
  const { checkPermission } = useAdmin();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when Ctrl/Cmd is pressed
      if (!(event.ctrlKey || event.metaKey)) return;

      // Prevent default browser shortcuts
      const shortcuts: Record<string, () => void> = {
        'n': () => {
          if (checkPermission('manage_users')) {
            window.location.href = '/admin/users/create';
          }
        },
        'm': () => {
          if (checkPermission('moderate_content')) {
            window.location.href = '/admin/moderation';
          }
        },
        'f': () => {
          if (checkPermission('manage_users')) {
            window.location.href = '/admin/users?search=true';
          }
        },
        'h': () => {
          if (checkPermission('manage_system')) {
            window.location.href = '/admin/system';
          }
        },
        'e': () => {
          if (checkPermission('view_analytics')) {
            // Trigger export
            console.log('Export shortcut triggered');
          }
        },
      };

      const shortcut = shortcuts[event.key.toLowerCase()];
      if (shortcut) {
        event.preventDefault();
        shortcut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checkPermission]);
}