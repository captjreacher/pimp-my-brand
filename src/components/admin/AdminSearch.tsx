import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Users,
  Flag,
  CreditCard,
  BarChart3,
  Settings,
  FileText,
  Shield,
  Database,
  Activity,
  Bell,
  User,
  Calendar,
  Hash,
  ExternalLink,
} from 'lucide-react';
import type { AdminPermission } from '@/lib/admin/types';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  requiredPermissions?: AdminPermission[];
}

interface AdminSearchProps {
  className?: string;
  placeholder?: string;
  showDialog?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AdminSearch({ 
  className, 
  placeholder = "Search admin...",
  showDialog = false,
  onOpenChange 
}: AdminSearchProps) {
  const { checkPermission } = useAdmin();
  const navigate = useNavigate();
  const [open, setOpen] = useState(showDialog);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  // Define searchable items
  const searchableItems: SearchResult[] = [
    // Navigation items
    {
      id: 'dashboard',
      title: 'Admin Dashboard',
      description: 'Main admin overview and metrics',
      category: 'Navigation',
      icon: BarChart3,
      href: '/admin',
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage user accounts and profiles',
      category: 'Navigation',
      icon: Users,
      href: '/admin/users',
      requiredPermissions: ['manage_users'],
    },
    {
      id: 'moderation',
      title: 'Content Moderation',
      description: 'Review and moderate user content',
      category: 'Navigation',
      icon: Flag,
      href: '/admin/moderation',
      badge: '12',
      requiredPermissions: ['moderate_content'],
    },
    {
      id: 'subscriptions',
      title: 'Subscription Management',
      description: 'Handle billing and subscriptions',
      category: 'Navigation',
      icon: CreditCard,
      href: '/admin/subscriptions',
      requiredPermissions: ['manage_billing'],
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      description: 'View platform analytics and insights',
      category: 'Navigation',
      icon: BarChart3,
      href: '/admin/analytics',
      requiredPermissions: ['view_analytics'],
    },
    {
      id: 'system',
      title: 'System Health',
      description: 'Monitor system performance and health',
      category: 'Navigation',
      icon: Activity,
      href: '/admin/system',
      requiredPermissions: ['manage_system'],
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      description: 'View admin activity and audit trails',
      category: 'Navigation',
      icon: Shield,
      href: '/admin/audit',
      requiredPermissions: ['view_audit_logs'],
    },
    {
      id: 'settings',
      title: 'System Settings',
      description: 'Configure system-wide settings',
      category: 'Navigation',
      icon: Settings,
      href: '/admin/settings',
      requiredPermissions: ['manage_system'],
    },

    // Quick actions
    {
      id: 'create-user',
      title: 'Create New User',
      description: 'Add a new user account',
      category: 'Actions',
      icon: User,
      href: '/admin/users/create',
      requiredPermissions: ['manage_users'],
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Download system reports and data',
      category: 'Actions',
      icon: Database,
      href: '/admin/analytics/export',
      requiredPermissions: ['view_analytics'],
    },
    {
      id: 'send-notification',
      title: 'Send Notification',
      description: 'Broadcast message to users',
      category: 'Actions',
      icon: Bell,
      href: '/admin/notifications/create',
      requiredPermissions: ['manage_system'],
    },

    // Common searches
    {
      id: 'pending-content',
      title: 'Pending Content Review',
      description: 'Content awaiting moderation',
      category: 'Content',
      icon: Flag,
      href: '/admin/moderation?status=pending',
      requiredPermissions: ['moderate_content'],
    },
    {
      id: 'active-users',
      title: 'Active Users',
      description: 'Currently active user accounts',
      category: 'Users',
      icon: Users,
      href: '/admin/users?status=active',
      requiredPermissions: ['manage_users'],
    },
    {
      id: 'billing-issues',
      title: 'Billing Issues',
      description: 'Payment and subscription problems',
      category: 'Billing',
      icon: CreditCard,
      href: '/admin/subscriptions?filter=issues',
      badge: '3',
      requiredPermissions: ['manage_billing'],
    },
  ];

  // Filter items based on permissions and search query
  const filteredItems = searchableItems.filter(item => {
    // Check permissions
    if (item.requiredPermissions && 
        !item.requiredPermissions.every(permission => checkPermission(permission))) {
      return false;
    }

    // Check search query
    if (!query) return true;
    
    const searchTerm = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    );
  });

  // Group results by category
  const groupedResults = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const handleSelect = (href: string) => {
    navigate(href);
    setOpen(false);
    setQuery('');
    onOpenChange?.(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      setQuery('');
    }
  };

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Search trigger button */}
      <div className={className}>
        <Button
          variant="outline"
          className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
          onClick={() => setOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          {placeholder}
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      {/* Search dialog */}
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput 
          placeholder="Search admin panel..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {Object.entries(groupedResults).map(([category, items]) => (
            <React.Fragment key={category}>
              <CommandGroup heading={category}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.description}`}
                    onSelect={() => handleSelect(item.href)}
                    className="flex items-center gap-2 p-3"
                  >
                    <item.icon className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs h-4 px-1">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          ))}
          
          {/* Help section */}
          <CommandGroup heading="Help">
            <CommandItem className="text-xs text-muted-foreground">
              <Hash className="mr-2 h-3 w-3" />
              Use Ctrl+K to open search anytime
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

// Compact search input for header
export function AdminSearchInput({ className, ...props }: AdminSearchProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search admin..."
          className="w-64 pl-8 cursor-pointer"
          onClick={() => setOpen(true)}
          readOnly
        />
      </div>
      <AdminSearch 
        showDialog={open} 
        onOpenChange={setOpen}
        {...props}
      />
    </div>
  );
}