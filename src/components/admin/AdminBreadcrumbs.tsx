import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home, Shield } from 'lucide-react';

interface BreadcrumbConfig {
  [key: string]: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    dynamic?: boolean; // If true, the label can be dynamically generated
  };
}

// Configuration for admin breadcrumb labels
const breadcrumbConfig: BreadcrumbConfig = {
  admin: { label: 'Admin Dashboard', icon: Shield },
  users: { label: 'User Management' },
  roles: { label: 'Roles & Permissions' },
  moderation: { label: 'Content Moderation' },
  content: { label: 'Content Library' },
  subscriptions: { label: 'Subscription Management' },
  analytics: { label: 'Analytics & Reports' },
  system: { label: 'System Health' },
  audit: { label: 'Audit Logs' },
  database: { label: 'Database Management' },
  settings: { label: 'System Settings' },
  notifications: { label: 'Notifications' },
  profile: { label: 'Admin Profile' },
  // Dynamic segments that might have IDs
  user: { label: 'User Details', dynamic: true },
  subscription: { label: 'Subscription Details', dynamic: true },
  log: { label: 'Log Details', dynamic: true },
};

interface AdminBreadcrumbsProps {
  className?: string;
  showHome?: boolean;
  maxItems?: number;
}

export function AdminBreadcrumbs({ 
  className, 
  showHome = false, 
  maxItems = 5 
}: AdminBreadcrumbsProps) {
  const location = useLocation();

  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    // Add home if requested
    if (showHome) {
      breadcrumbs.push({
        label: 'Home',
        href: '/dashboard',
        icon: Home,
        isLast: false,
      });
    }

    // Process path segments
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const href = '/' + pathSegments.slice(0, i + 1).join('/');
      const isLast = i === pathSegments.length - 1;

      // Get configuration for this segment
      const config = breadcrumbConfig[segment];
      
      let label = segment;
      let icon = undefined;

      if (config) {
        label = config.label;
        icon = config.icon;
        
        // Handle dynamic segments (like IDs)
        if (config.dynamic && i > 0) {
          const prevSegment = pathSegments[i - 1];
          const prevConfig = breadcrumbConfig[prevSegment];
          
          if (prevConfig) {
            // For dynamic segments, try to create a more meaningful label
            if (segment.match(/^[0-9a-f-]{36}$/i)) {
              // Looks like a UUID
              label = `${prevConfig.label.replace(/s$/, '')} Details`;
            } else if (segment.match(/^\d+$/)) {
              // Looks like a numeric ID
              label = `${prevConfig.label.replace(/s$/, '')} #${segment}`;
            } else {
              // Use the segment as-is but capitalize
              label = segment.charAt(0).toUpperCase() + segment.slice(1);
            }
          }
        }
      } else {
        // Convert kebab-case or snake_case to Title Case
        label = segment
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      breadcrumbs.push({
        label,
        href,
        icon,
        isLast,
      });
    }

    // Limit the number of breadcrumbs if specified
    if (maxItems && breadcrumbs.length > maxItems) {
      const start = breadcrumbs.slice(0, 1); // Keep first item
      const end = breadcrumbs.slice(-(maxItems - 2)); // Keep last items
      const ellipsis = { label: '...', href: '', isLast: false, isEllipsis: true };
      return [...start, ellipsis, ...end];
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for single-level paths
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={`${crumb.href}-${index}`}>
            <BreadcrumbItem>
              {crumb.isEllipsis ? (
                <span className="text-muted-foreground">...</span>
              ) : crumb.isLast ? (
                <BreadcrumbPage className="flex items-center gap-1">
                  {crumb.icon && (
                    <crumb.icon className="h-4 w-4" />
                  )}
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.href} className="flex items-center gap-1">
                    {crumb.icon && (
                      <crumb.icon className="h-4 w-4" />
                    )}
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!crumb.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Hook to get current breadcrumb information
export function useAdminBreadcrumbs() {
  const location = useLocation();

  const getCurrentSection = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length < 2) return null;
    
    const section = pathSegments[1]; // First segment after /admin
    return breadcrumbConfig[section] || null;
  };

  const getCurrentPath = () => {
    return location.pathname;
  };

  const getParentPath = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length <= 2) return '/admin';
    
    return '/' + pathSegments.slice(0, -1).join('/');
  };

  return {
    getCurrentSection,
    getCurrentPath,
    getParentPath,
  };
}