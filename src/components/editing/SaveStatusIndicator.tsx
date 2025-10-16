import React from 'react';
import { AutoSaveState, SaveStatus } from '@/hooks/use-auto-save';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Save, 
  Loader2, 
  Check, 
  AlertTriangle, 
  WifiOff, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveStatusIndicatorProps {
  state: AutoSaveState;
  onForceSave?: () => void;
  onResolveConflict?: () => void;
  className?: string;
  showLastSaved?: boolean;
}

const statusConfig: Record<SaveStatus, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
}> = {
  idle: {
    icon: Save,
    label: 'Ready',
    variant: 'outline',
    color: 'text-gray-500',
  },
  saving: {
    icon: Loader2,
    label: 'Saving...',
    variant: 'default',
    color: 'text-blue-600',
  },
  saved: {
    icon: Check,
    label: 'Saved',
    variant: 'outline',
    color: 'text-green-600',
  },
  error: {
    icon: AlertTriangle,
    label: 'Save failed',
    variant: 'destructive',
    color: 'text-red-600',
  },
  conflict: {
    icon: AlertTriangle,
    label: 'Conflict',
    variant: 'destructive',
    color: 'text-orange-600',
  },
  offline: {
    icon: WifiOff,
    label: 'Offline',
    variant: 'secondary',
    color: 'text-gray-600',
  },
};

/**
 * Format relative time for last saved display
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function SaveStatusIndicator({
  state,
  onForceSave,
  onResolveConflict,
  className = '',
  showLastSaved = true,
}: SaveStatusIndicatorProps) {
  const config = statusConfig[state.status];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Status Badge */}
      <Badge 
        variant={config.variant}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1',
          config.color
        )}
      >
        <Icon 
          className={cn(
            'h-3 w-3',
            state.status === 'saving' && 'animate-spin'
          )} 
        />
        <span className="text-xs font-medium">{config.label}</span>
      </Badge>

      {/* Unsaved Changes Indicator */}
      {state.hasUnsavedChanges && state.status !== 'saving' && (
        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
          Unsaved changes
        </Badge>
      )}

      {/* Last Saved Time */}
      {showLastSaved && state.lastSaved && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Saved {formatRelativeTime(state.lastSaved)}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {/* Force Save Button */}
        {(state.status === 'error' || state.status === 'offline') && onForceSave && (
          <Button
            size="sm"
            variant="outline"
            onClick={onForceSave}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}

        {/* Resolve Conflict Button */}
        {state.status === 'conflict' && onResolveConflict && (
          <Button
            size="sm"
            variant="outline"
            onClick={onResolveConflict}
            className="h-7 px-2 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Resolve
          </Button>
        )}
      </div>

      {/* Online/Offline Indicator */}
      {!state.isOnline && (
        <Badge variant="secondary" className="text-xs">
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      )}
    </div>
  );
}

/**
 * Compact version of the save status indicator for smaller spaces
 */
export function CompactSaveStatusIndicator({
  state,
  onForceSave,
  className = '',
}: Pick<SaveStatusIndicatorProps, 'state' | 'onForceSave' | 'className'>) {
  const config = statusConfig[state.status];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div 
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-md text-xs',
          config.color,
          state.status === 'error' && 'bg-red-50',
          state.status === 'saved' && 'bg-green-50',
          state.status === 'saving' && 'bg-blue-50',
          state.status === 'conflict' && 'bg-orange-50',
          state.status === 'offline' && 'bg-gray-50'
        )}
      >
        <Icon 
          className={cn(
            'h-3 w-3',
            state.status === 'saving' && 'animate-spin'
          )} 
        />
        <span className="font-medium">{config.label}</span>
      </div>

      {state.hasUnsavedChanges && state.status !== 'saving' && (
        <div className="w-2 h-2 bg-amber-400 rounded-full" title="Unsaved changes" />
      )}

      {(state.status === 'error' || state.status === 'offline') && onForceSave && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onForceSave}
          className="h-6 w-6 p-0"
          title="Retry save"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}