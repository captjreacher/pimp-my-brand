// Configuration history dialog component
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  RotateCcw, 
  User, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { useSystemConfig } from '@/hooks/use-system-config';

interface ConfigHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configKey: string;
}

export function ConfigHistoryDialog({ open, onOpenChange, configKey }: ConfigHistoryDialogProps) {
  const { configHistory, rollbackConfig } = useSystemConfig();

  const handleRollback = async (historyId: string, targetValue: any) => {
    if (!confirm('Are you sure you want to rollback to this configuration value?')) return;

    try {
      await rollbackConfig({
        config_key: configKey,
        target_history_id: historyId,
        reason: `Rollback via admin interface`
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to rollback configuration:', error);
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }
    
    if (typeof value === 'object') {
      return (
        <code className="text-xs bg-muted px-2 py-1 rounded block max-w-xs overflow-hidden">
          {JSON.stringify(value, null, 2)}
        </code>
      );
    }
    
    return (
      <code className="text-sm bg-muted px-2 py-1 rounded">
        {String(value)}
      </code>
    );
  };

  const getChangeType = (oldValue: any, newValue: any) => {
    if (oldValue === null || oldValue === undefined) {
      return { type: 'created', color: 'bg-green-100 text-green-800' };
    }
    if (newValue === null || newValue === undefined) {
      return { type: 'deleted', color: 'bg-red-100 text-red-800' };
    }
    return { type: 'updated', color: 'bg-blue-100 text-blue-800' };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Configuration History: {configKey}
          </DialogTitle>
          <DialogDescription>
            View the change history for this configuration and rollback to previous values if needed
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {configHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No history available for this configuration</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Change</TableHead>
                  <TableHead>Old Value</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configHistory.map((history, index) => {
                  const changeType = getChangeType(history.old_value, history.new_value);
                  
                  return (
                    <TableRow key={history.id}>
                      <TableCell>
                        <Badge className={changeType.color}>
                          {changeType.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {formatValue(history.old_value)}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex items-center gap-2">
                          {history.old_value !== null && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          {formatValue(history.new_value)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {(history as any).changed_by_profile?.full_name || 
                             (history as any).changed_by_profile?.email || 
                             'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {new Date(history.created_at).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {index > 0 && ( // Don't allow rollback to the current value (first item)
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRollback(history.id, history.old_value || history.new_value)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Rollback
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}