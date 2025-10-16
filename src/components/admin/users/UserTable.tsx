import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MoreHorizontal,
  Eye,
  UserX,
  UserCheck,
  Shield,
  Trash2,
  MessageSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { type AdminUserView } from '@/lib/admin/user-management-service';

interface UserTableProps {
  users: AdminUserView[];
  selectedUsers: string[];
  onUserSelect: (userId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onUserAction: (userId: string, action: string) => void;
  onViewUser: (userId: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  isLoading?: boolean;
}

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

const getStatusBadgeVariant = (isSuspended: boolean) => {
  return isSuspended ? 'destructive' : 'default';
};

const SortableHeader: React.FC<{
  column: string;
  children: React.ReactNode;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}> = ({ column, children, sortBy, sortOrder, onSort }) => {
  const isSorted = sortBy === column;
  
  return (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort?.(column)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {onSort && (
          <div className="flex flex-col">
            {isSorted ? (
              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-50" />
            )}
          </div>
        )}
      </div>
    </TableHead>
  );
};

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUsers,
  onUserSelect,
  onSelectAll,
  onUserAction,
  onViewUser,
  sortBy,
  sortOrder,
  onSort,
  isLoading = false
}) => {
  const allSelected = users.length > 0 && selectedUsers.length === users.length;
  const someSelected = selectedUsers.length > 0 && selectedUsers.length < users.length;

  const handleSelectAll = (checked: boolean) => {
    onSelectAll(checked);
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    onUserSelect(userId, checked);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'N/A';
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
            <div className="w-20 h-6 bg-muted rounded" />
            <div className="w-16 h-6 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
              />
            </TableHead>
            <SortableHeader column="email" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>
              User
            </SortableHeader>
            <SortableHeader column="app_role" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>
              Role
            </SortableHeader>
            <TableHead>Subscription</TableHead>
            <TableHead>Content</TableHead>
            <SortableHeader column="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>
              Joined
            </SortableHeader>
            <SortableHeader column="last_sign_in" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>
              Last Active
            </SortableHeader>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50">
              <TableCell>
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.full_name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.app_role)}>
                  {user.app_role.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {user.subscription_tier || 'Free'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{user.content_count} items</div>
                  <div className="text-muted-foreground">
                    {user.total_generations} generations
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{formatDate(user.created_at)}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {user.last_sign_in ? formatDate(user.last_sign_in) : 'Never'}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(user.is_suspended)}>
                  {user.is_suspended ? 'Suspended' : 'Active'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewUser(user.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUserAction(user.id, 'notes')}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Add Notes
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user.is_suspended ? (
                      <DropdownMenuItem onClick={() => onUserAction(user.id, 'activate')}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activate User
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onUserAction(user.id, 'suspend')}>
                        <UserX className="mr-2 h-4 w-4" />
                        Suspend User
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onUserAction(user.id, 'role')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Change Role
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onUserAction(user.id, 'delete')}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};