import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Shield,
  CreditCard,
  BarChart3,
  Settings,
  FileText,
  AlertTriangle,
  Activity,
  Database,
  LogOut,
  Crown,
  UserCheck,
  Flag,
} from 'lucide-react';
import type { AdminPermission } from '@/lib/admin/types';

interface AdminNavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  requiredPermissions?: AdminPermission[];
  description?: string;
}

interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export function AdminSidebar() {
  const { user, permissions, logout, checkPermission } = useAdmin();
  const location = useLocation();

  // Define navigation structure based on admin permissions
  const navigationGroups: AdminNavGroup[] = [
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          url: '/admin',
          icon: BarChart3,
          description: 'System overview and key metrics',
        },
      ],
    },
    {
      title: 'User Management',
      items: [
        {
          title: 'Users',
          url: '/admin/users',
          icon: Users,
          requiredPermissions: ['manage_users'],
          description: 'Manage user accounts and profiles',
        },
        {
          title: 'Roles & Permissions',
          url: '/admin/roles',
          icon: UserCheck,
          requiredPermissions: ['manage_users'],
          description: 'Configure user roles and permissions',
        },
      ],
    },
    {
      title: 'Content',
      items: [
        {
          title: 'Moderation Queue',
          url: '/admin/moderation',
          icon: Flag,
          badge: '12', // This would come from real data
          requiredPermissions: ['moderate_content'],
          description: 'Review flagged content',
        },
        {
          title: 'Content Library',
          url: '/admin/content',
          icon: FileText,
          requiredPermissions: ['moderate_content'],
          description: 'Browse all user content',
        },
      ],
    },
    {
      title: 'Business',
      items: [
        {
          title: 'Subscriptions',
          url: '/admin/subscriptions',
          icon: CreditCard,
          requiredPermissions: ['manage_billing'],
          description: 'Manage user subscriptions and billing',
        },
        {
          title: 'Analytics',
          url: '/admin/analytics',
          icon: BarChart3,
          requiredPermissions: ['view_analytics'],
          description: 'View platform analytics and reports',
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          title: 'System Health',
          url: '/admin/system',
          icon: Activity,
          requiredPermissions: ['manage_system'],
          description: 'Monitor system performance',
        },
        {
          title: 'Audit Logs',
          url: '/admin/audit',
          icon: Shield,
          requiredPermissions: ['view_audit_logs'],
          description: 'View admin activity logs',
        },
        {
          title: 'Database',
          url: '/admin/database',
          icon: Database,
          requiredPermissions: ['manage_system'],
          description: 'Database management tools',
        },
        {
          title: 'Settings',
          url: '/admin/settings',
          icon: Settings,
          requiredPermissions: ['manage_system'],
          description: 'System configuration',
        },
      ],
    },
  ];

  // Filter navigation items based on user permissions
  const filteredGroups = navigationGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => 
        !item.requiredPermissions || 
        item.requiredPermissions.every(permission => checkPermission(permission))
      ),
    }))
    .filter(group => group.items.length > 0);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'moderator':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return Crown;
      case 'admin':
        return Shield;
      case 'moderator':
        return UserCheck;
      default:
        return Users;
    }
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Admin Panel</span>
            <span className="text-xs text-muted-foreground">Personal Brand Gen</span>
          </div>
        </div>
        
        {user && (
          <div className="px-2 py-2">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                {React.createElement(getRoleIcon(user.app_role), { 
                  className: "h-3 w-3 text-primary" 
                })}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium truncate">
                  {user.email || 'Admin User'}
                </span>
                <Badge 
                  variant={getRoleBadgeVariant(user.app_role)} 
                  className="text-xs h-4 px-1"
                >
                  {user.app_role.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {filteredGroups.map((group, groupIndex) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url || 
                    (item.url !== '/admin' && location.pathname.startsWith(item.url));
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.description}
                      >
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          {item.badge && (
                            <SidebarMenuBadge>
                              {item.badge}
                            </SidebarMenuBadge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
            {groupIndex < filteredGroups.length - 1 && <SidebarSeparator />}
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout from admin panel"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <div className="px-2 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            <span>System Status: Online</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}