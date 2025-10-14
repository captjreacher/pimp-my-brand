import React, { useCallback, useEffect, useState } from 'react';
import { useAutoSave, AutoSaveOptions } from '@/hooks/use-auto-save';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { ConflictResolutionDialog } from './ConflictResolutionDialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveEditorProps<T> {
  /** Initial data */
  initialData: T;
  /** Auto-save options */
  autoSaveOptions: Omit<AutoSaveOptions<T>, 'localStorageKey'>;
  /** Local storage key for offline backup */
  localStorageKey: string;
  /** Render function for the editor */
  children: (data: T, onChange: (data: T) => void, isLoading: boolean) => React.ReactNode;
  /** Custom conflict resolution renderer */
  renderConflictDiff?: (local: T, server: T) => React.ReactNode;
  /** Data formatter for conflict resolution */
  formatData?: (data: T) => string;
  /** Show save status indicator */
  showSaveStatus?: boolean;
  /** Show offline backup controls */
  showOfflineControls?: boolean;
  /** Additional className */
  className?: string;
  /** Called when data changes */
  onDataChange?: (data: T) => void;
  /** Called when save status changes */
  onSaveStatusChange?: (status: string) => void;
}

export function AutoSaveEditor<T>({
  initialData,
  autoSaveOptions,
  localStorageKey,
  children,
  renderConflictDiff,
  formatData,
  showSaveStatus = true,
  showOfflineControls = true,
  className = '',
  onDataChange,
  onSaveStatusChange,
}: AutoSaveEditorProps<T>) {
  const { toast } = useToast();
  const [currentData, setCurrentData] = useState<T>(initialData);
  const [conflictData, setConflictData] = useState<T | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Set up auto-save with local storage key
  const [saveState, saveActions] = useAutoSave<T>({
    ...autoSaveOptions,
    localStorageKey,
    onSave: async (data: T) => {
      try {
        await autoSaveOptions.onSave(data);
      } catch (error: any) {
        // Handle conflict errors
        if (error?.message?.includes('conflict') || error?.status === 409) {
          if (autoSaveOptions.onLoad) {
            try {
              const serverData = await autoSaveOptions.onLoad();
              setConflictData(serverData);
              setShowConflictDialog(true);
            } catch (loadError) {
              console.error('Failed to load server data for conflict resolution:', loadError);
            }
          }
        }
        throw error;
      }
    },
  });

  // Initialize with offline backup if available
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check for offline backup
        const offlineBackup = saveActions.getOfflineBackup();
        
        if (offlineBackup && showOfflineControls) {
          // Show option to restore from backup
          toast({
            title: 'Offline backup found',
            description: 'Would you like to restore your unsaved changes?',
            action: (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setCurrentData(offlineBackup);
                    onDataChange?.(offlineBackup);
                    toast({
                      title: 'Backup restored',
                      description: 'Your offline changes have been restored.',
                    });
                  }}
                >
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    saveActions.clearOfflineBackup();
                    toast({
                      title: 'Backup cleared',
                      description: 'Offline backup has been removed.',
                    });
                  }}
                >
                  Discard
                </Button>
              </div>
            ),
          });
        }
      } catch (error) {
        console.warn('Failed to check offline backup:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeData();
  }, [saveActions, showOfflineControls, toast, onDataChange]);

  // Handle data changes
  const handleDataChange = useCallback((newData: T) => {
    setCurrentData(newData);
    onDataChange?.(newData);
    
    // Trigger auto-save
    saveActions.save(newData);
  }, [saveActions, onDataChange]);

  // Handle force save
  const handleForceSave = useCallback(() => {
    saveActions.forceSave(currentData);
  }, [saveActions, currentData]);

  // Handle conflict resolution
  const handleResolveConflict = useCallback(async (useServerVersion: boolean, data?: T) => {
    await saveActions.resolveConflict(useServerVersion, data);
    
    if (useServerVersion && conflictData) {
      setCurrentData(conflictData);
      onDataChange?.(conflictData);
    }
    
    setConflictData(null);
    setShowConflictDialog(false);
  }, [saveActions, conflictData, onDataChange]);

  // Handle manual backup export
  const handleExportBackup = useCallback(() => {
    try {
      const backup = {
        data: currentData,
        timestamp: new Date().toISOString(),
        version: Date.now(),
      };
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Backup exported',
        description: 'Your data has been exported as a backup file.',
      });
    } catch (error) {
      console.error('Failed to export backup:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export backup file.',
        variant: 'destructive',
      });
    }
  }, [currentData, toast]);

  // Handle manual backup import
  const handleImportBackup = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const backup = JSON.parse(content);
          
          if (backup.data) {
            setCurrentData(backup.data);
            onDataChange?.(backup.data);
            
            toast({
              title: 'Backup imported',
              description: 'Your backup has been restored successfully.',
            });
          } else {
            throw new Error('Invalid backup format');
          }
        } catch (error) {
          console.error('Failed to import backup:', error);
          toast({
            title: 'Import failed',
            description: 'Failed to import backup file. Please check the file format.',
            variant: 'destructive',
          });
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }, [onDataChange, toast]);

  // Notify parent of save status changes
  useEffect(() => {
    onSaveStatusChange?.(saveState.status);
  }, [saveState.status, onSaveStatusChange]);

  return (
    <div className={className}>
      {/* Save Status Header */}
      {showSaveStatus && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <SaveStatusIndicator
                state={saveState}
                onForceSave={handleForceSave}
                onResolveConflict={() => setShowConflictDialog(true)}
              />
              
              {/* Offline Controls */}
              {showOfflineControls && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportBackup}
                    title="Export backup"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleImportBackup}
                    title="Import backup"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Import
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Offline Warning */}
      {!saveState.isOnline && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                You are currently offline. Changes will be saved locally and synced when connection is restored.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor Content */}
      <div className="relative">
        {children(currentData, handleDataChange, isInitializing)}
        
        {/* Loading Overlay */}
        {isInitializing && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="text-sm text-gray-600">Initializing editor...</div>
          </div>
        )}
      </div>

      {/* Conflict Resolution Dialog */}
      {conflictData && (
        <ConflictResolutionDialog
          open={showConflictDialog}
          onOpenChange={setShowConflictDialog}
          localData={currentData}
          serverData={conflictData}
          onResolve={handleResolveConflict}
          renderDiff={renderConflictDiff}
          formatData={formatData}
        />
      )}
    </div>
  );
}

/**
 * Specialized auto-save editor for text content
 */
export function AutoSaveTextEditor({
  initialText,
  onSave,
  onLoad,
  localStorageKey,
  placeholder = "Start typing...",
  className = '',
  showSaveStatus = true,
}: {
  initialText: string;
  onSave: (text: string) => Promise<void>;
  onLoad?: () => Promise<string>;
  localStorageKey: string;
  placeholder?: string;
  className?: string;
  showSaveStatus?: boolean;
}) {
  return (
    <AutoSaveEditor
      initialData={initialText}
      autoSaveOptions={{
        onSave,
        onLoad,
        debounceMs: 1000, // Faster debounce for text
        showToasts: true,
      }}
      localStorageKey={localStorageKey}
      showSaveStatus={showSaveStatus}
      formatData={(text) => text}
      className={className}
    >
      {(text, onChange, isLoading) => (
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full h-64 p-4 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </AutoSaveEditor>
  );
}