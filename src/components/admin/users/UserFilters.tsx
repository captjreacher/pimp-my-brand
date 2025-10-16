import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';

export interface UserFilterState {
  search: string;
  role: string;
  status: 'all' | 'active' | 'suspended';
  subscription: string;
}

interface UserFiltersProps {
  filters: UserFilterState;
  onFiltersChange: (filters: UserFilterState) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'user', label: 'User' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' }
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' }
];

const subscriptionOptions = [
  { value: 'all', label: 'All Subscriptions' },
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'premium', label: 'Premium' }
];

export const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  isLoading = false
}) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleRoleChange = (value: string) => {
    onFiltersChange({ ...filters, role: value });
  };

  const handleStatusChange = (value: 'all' | 'active' | 'suspended') => {
    onFiltersChange({ ...filters, status: value });
  };

  const handleSubscriptionChange = (value: string) => {
    onFiltersChange({ ...filters, subscription: value });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.role && filters.role !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.subscription && filters.subscription !== 'all') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center space-x-2"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
            <span>Clear Filters</span>
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <Select
          value={filters.role || 'all'}
          onValueChange={handleRoleChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={handleStatusChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.subscription || 'all'}
          onValueChange={handleSubscriptionChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Subscription" />
          </SelectTrigger>
          <SelectContent>
            {subscriptionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Search: "{filters.search}"</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => handleSearchChange('')}
              />
            </Badge>
          )}
          
          {filters.role && filters.role !== 'all' && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Role: {roleOptions.find(r => r.value === filters.role)?.label}</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => handleRoleChange('all')}
              />
            </Badge>
          )}
          
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Status: {statusOptions.find(s => s.value === filters.status)?.label}</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => handleStatusChange('all')}
              />
            </Badge>
          )}
          
          {filters.subscription && filters.subscription !== 'all' && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Subscription: {subscriptionOptions.find(s => s.value === filters.subscription)?.label}</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => handleSubscriptionChange('all')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};