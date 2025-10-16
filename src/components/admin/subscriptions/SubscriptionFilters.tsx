import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { SubscriptionFilters as FilterType } from '@/lib/admin/types/subscription-types';

interface SubscriptionFiltersProps {
  filters: Partial<FilterType>;
  onFiltersChange: (filters: Partial<FilterType>) => void;
  onClearFilters: () => void;
}

export function SubscriptionFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: SubscriptionFiltersProps) {
  const tiers = [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
    { value: 'elite', label: 'Elite' },
  ];

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'trialing', label: 'Trialing' },
    { value: 'past_due', label: 'Past Due' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'incomplete', label: 'Incomplete' },
  ];

  const handleSearchChange = (value: string) => {
    onFiltersChange({ search: value });
  };

  const handleTierToggle = (tier: string) => {
    const currentTiers = filters.tier || [];
    const newTiers = currentTiers.includes(tier as any)
      ? currentTiers.filter(t => t !== tier)
      : [...currentTiers, tier as any];
    
    onFiltersChange({ tier: newTiers });
  };

  const handleStatusToggle = (status: string) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    onFiltersChange({ status: newStatuses });
  };

  const handleDateRangeChange = (range: { start: Date; end: Date } | null) => {
    onFiltersChange({
      dateRange: range ? {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      } : null,
    });
  };

  const activeFiltersCount = [
    filters.search,
    filters.tier?.length,
    filters.status?.length,
    filters.dateRange,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search by user email or name..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Tier Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start">
              <Filter className="mr-2 h-4 w-4" />
              Tier
              {filters.tier && filters.tier.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.tier.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="start">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Subscription Tier</h4>
              {tiers.map((tier) => (
                <label key={tier.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.tier?.includes(tier.value as any) || false}
                    onChange={() => handleTierToggle(tier.value)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{tier.label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Status Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start">
              <Filter className="mr-2 h-4 w-4" />
              Status
              {filters.status && filters.status.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.status.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="start">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Subscription Status</h4>
              {statuses.map((status) => (
                <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(status.value) || false}
                    onChange={() => handleStatusToggle(status.value)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{status.label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange ? (
                <>
                  {format(new Date(filters.dateRange.start), 'MMM d')} - {' '}
                  {format(new Date(filters.dateRange.end), 'MMM d, yyyy')}
                </>
              ) : (
                'Date Range'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={
                filters.dateRange
                  ? {
                      from: new Date(filters.dateRange.start),
                      to: new Date(filters.dateRange.end),
                    }
                  : undefined
              }
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  handleDateRangeChange({ start: range.from, end: range.to });
                } else {
                  handleDateRangeChange(null);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={onClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary">
              Search: {filters.search}
              <button
                onClick={() => onFiltersChange({ search: '' })}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.tier?.map((tier) => (
            <Badge key={tier} variant="secondary">
              Tier: {tier}
              <button
                onClick={() => handleTierToggle(tier)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {filters.status?.map((status) => (
            <Badge key={status} variant="secondary">
              Status: {status}
              <button
                onClick={() => handleStatusToggle(status)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {filters.dateRange && (
            <Badge variant="secondary">
              Date: {format(new Date(filters.dateRange.start), 'MMM d')} - {' '}
              {format(new Date(filters.dateRange.end), 'MMM d')}
              <button
                onClick={() => handleDateRangeChange(null)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}