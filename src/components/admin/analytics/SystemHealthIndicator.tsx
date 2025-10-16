import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2,
  Activity
} from 'lucide-react';

interface SystemHealthIndicatorProps {
  isHealthy: boolean;
  alertCount: number;
  loading?: boolean;
  onClick?: () => void;
}

export const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({
  isHealthy,
  alertCount,
  loading = false,
  onClick
}) => {
  const getHealthStatus = () => {
    if (loading) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        label: 'Checking...',
        variant: 'secondary' as const,
        color: 'text-gray-600'
      };
    }

    if (alertCount > 0) {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        label: `${alertCount} Alert${alertCount > 1 ? 's' : ''}`,
        variant: 'destructive' as const,
        color: 'text-red-600'
      };
    }

    if (isHealthy) {
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        label: 'Healthy',
        variant: 'default' as const,
        color: 'text-green-600'
      };
    }

    return {
      icon: <XCircle className="h-4 w-4" />,
      label: 'Degraded',
      variant: 'destructive' as const,
      color: 'text-red-600'
    };
  };

  const status = getHealthStatus();

  const HealthBadge = () => (
    <Badge 
      variant={status.variant}
      className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      <div className={status.color}>
        {status.icon}
      </div>
      <span>{status.label}</span>
    </Badge>
  );

  const getTooltipContent = () => {
    if (loading) return 'Checking system health...';
    
    if (alertCount > 0) {
      return `System has ${alertCount} active alert${alertCount > 1 ? 's' : ''}. Click to view details.`;
    }
    
    if (isHealthy) {
      return 'All systems operational. No active alerts.';
    }
    
    return 'System performance is degraded. Check alerts for details.';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <HealthBadge />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};