import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Filter, X, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ContentModerationFilters } from '@/lib/admin/api/content-moderation-api';
import { FlagReason, ContentType, ModerationStatus } from '@/lib/admin/moderation-service';

interface ModerationFiltersProps {
  filters: ContentModerationFilters;
  flagReasons: FlagReason[];
  onFiltersChange: (filters: ContentModerationFilters) => void;
}

export function ModerationFilters({ filters, flagReasons, onFiltersChange }: ModerationFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ContentModerationFilters>(filters);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.dateFrom ? new Date(filters.dateFrom) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.dateTo ? new Date(filters.dateTo) : undefined
  );

  const handleFilterChange = (key: keyof ContentModerationFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    handleFilterChange('dateFrom', date?.toISOString());
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    handleFilterChange('dateTo', date?.toISOString());
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const emptyFilters: ContentModerationFilters = {};
    setLocalFilters(emptyFilters);
    setDateFrom(undefined);
    setDateTo(undefined);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.keys(localFilters).some(key => 
    localFilters[key as keyof ContentModerationFilters] !== undefined &&
    localFilters[key as keyof ContentModerationFilters] !== ''
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Content Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="contentType">Content Type</Label>
          <Select
            value={localFilters.contentType || ''}
            onValueChange={(value) => handleFilterChange('contentType', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="brand">Brands</SelectItem>
              <SelectItem value="cv">CVs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <Label htmlFor="priority">Min Priority</Label>
          <Select
            value={localFilters.priorityMin?.toString() || ''}
            onValueChange={(value) => handleFilterChange('priorityMin', value ? parseInt(value) : undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any priority</SelectItem>
              <SelectItem value="1">Low (1+)</SelectItem>
              <SelectItem value="2">Medium (2+)</SelectItem>
              <SelectItem value="3">High (3+)</SelectItem>
              <SelectItem value="4">Very High (4+)</SelectItem>
              <SelectItem value="5">Critical (5)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Risk Score Filter */}
        <div className="space-y-2">
          <Label htmlFor="riskScore">Min Risk Score</Label>
          <Input
            id="riskScore"
            type="number"
            min="0"
            max="100"
            placeholder="0-100"
            value={localFilters.riskScoreMin || ''}
            onChange={(e) => handleFilterChange('riskScoreMin', e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>

        {/* User ID Filter */}
        <div className="space-y-2">
          <Label htmlFor="userId">User ID</Label>
          <Input
            id="userId"
            placeholder="Filter by user ID"
            value={localFilters.userId || ''}
            onChange={(e) => handleFilterChange('userId', e.target.value || undefined)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Date From */}
        <div className="space-y-2">
          <Label>Date From</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={handleDateFromChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <Label>Date To</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={handleDateToChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Auto Flagged Filter */}
        <div className="space-y-2">
          <Label>Auto Flagged</Label>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="autoFlagged"
              checked={localFilters.autoFlagged === true}
              onCheckedChange={(checked) => 
                handleFilterChange('autoFlagged', checked === true ? true : undefined)
              }
            />
            <Label htmlFor="autoFlagged" className="text-sm">
              Show only auto-flagged content
            </Label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Filters Active
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button
            size="sm"
            onClick={applyFilters}
          >
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}