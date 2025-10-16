import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X,
  RefreshCw,
  Bell,
  BellOff
} from 'lucide-react';
import type { AnalyticsAlert } from '@/lib/admin/types/analytics-types';

interface AlertsPanelProps {
  alerts: AnalyticsAlert[];
  onRefresh?: () => void;
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}

const AlertItem: React.FC<{
  alert: AnalyticsAlert;
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}> = ({ alert, onAcknowledge, onDismiss }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <Bell className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Alert variant={getSeverityColor(alert.severity) as any} className="relative">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getSeverityIcon(alert.severity)}
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{alert.title}</h4>
              <Badge variant={getSeverityColor(alert.severity) as any} className="text-xs">
                {alert.severity.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              {!alert.acknowledged && onAcknowledge && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAcknowledge(alert.id)}
                  className="h-6 px-2 text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ack
                </Button>
              )}
              
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDismiss(alert.id)}
                  className="h-6 px-2 text-xs"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          <AlertDescription className="text-sm">
            {alert.message}
          </AlertDescription>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Threshold: {alert.threshold} | Current: {alert.current_value.toFixed(2)}
            </span>
            <span>{formatTimestamp(alert.created_at)}</span>
          </div>
          
          {alert.acknowledged && (
            <div className="text-xs text-muted-foreground">
              Acknowledged by {alert.acknowledged_by} at {formatTimestamp(alert.acknowledged_at!)}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
};

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onRefresh,
  onAcknowledge,
  onDismiss
}) => {
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);
  
  const displayAlerts = showAcknowledged ? acknowledgedAlerts : activeAlerts;

  const getCriticalCount = () => {
    return activeAlerts.filter(alert => alert.severity === 'critical').length;
  };

  const getHighCount = () => {
    return activeAlerts.filter(alert => alert.severity === 'high').length;
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
              {activeAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {activeAlerts.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-orange-700">
              {getCriticalCount() > 0 && (
                <span className="font-medium">
                  {getCriticalCount()} critical, {getHighCount()} high priority alerts
                </span>
              )}
              {getCriticalCount() === 0 && getHighCount() > 0 && (
                <span className="font-medium">
                  {getHighCount()} high priority alerts
                </span>
              )}
              {getCriticalCount() === 0 && getHighCount() === 0 && activeAlerts.length > 0 && (
                <span>
                  {activeAlerts.length} active alert{activeAlerts.length > 1 ? 's' : ''}
                </span>
              )}
              {activeAlerts.length === 0 && (
                <span>All alerts have been acknowledged</span>
              )}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {acknowledgedAlerts.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAcknowledged(!showAcknowledged)}
                className="text-xs"
              >
                {showAcknowledged ? <BellOff className="h-3 w-3 mr-1" /> : <Bell className="h-3 w-3 mr-1" />}
                {showAcknowledged ? 'Show Active' : `Show Acked (${acknowledgedAlerts.length})`}
              </Button>
            )}
            
            {onRefresh && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {displayAlerts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {showAcknowledged ? 'No acknowledged alerts' : 'No active alerts'}
          </div>
        ) : (
          displayAlerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onAcknowledge={onAcknowledge}
              onDismiss={onDismiss}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};