import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Clock, User, Server } from 'lucide-react';

interface ConflictResolutionDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localData: T;
  serverData: T;
  onResolve: (useServerVersion: boolean, data?: T) => Promise<void>;
  renderDiff?: (local: T, server: T) => React.ReactNode;
  formatData?: (data: T) => string;
  lastModified?: {
    local: Date;
    server: Date;
  };
}

/**
 * Default data formatter - converts object to formatted JSON
 */
function defaultFormatData<T>(data: T): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * Simple diff renderer that highlights differences
 */
function DefaultDiffRenderer<T>({ 
  local, 
  server, 
  formatData = defaultFormatData 
}: { 
  local: T; 
  server: T; 
  formatData?: (data: T) => string;
}) {
  const localStr = formatData(local);
  const serverStr = formatData(server);
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-medium">Your Version</span>
            <Badge variant="outline">Local</Badge>
          </div>
          <ScrollArea className="h-64 w-full border rounded-md p-3">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {localStr}
            </pre>
          </ScrollArea>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span className="font-medium">Server Version</span>
            <Badge variant="outline">Remote</Badge>
          </div>
          <ScrollArea className="h-64 w-full border rounded-md p-3">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {serverStr}
            </pre>
          </ScrollArea>
        </div>
      </div>
      
      {localStr !== serverStr && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              The versions are different. Choose which version to keep.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ConflictResolutionDialog<T>({
  open,
  onOpenChange,
  localData,
  serverData,
  onResolve,
  renderDiff,
  formatData = defaultFormatData,
  lastModified,
}: ConflictResolutionDialogProps<T>) {
  const [isResolving, setIsResolving] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<'local' | 'server' | null>(null);

  const handleResolve = async (useServerVersion: boolean) => {
    setIsResolving(true);
    try {
      await onResolve(useServerVersion, useServerVersion ? undefined : localData);
      onOpenChange(false);
      setSelectedVersion(null);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Conflict Detected
          </DialogTitle>
          <DialogDescription>
            This document has been modified by someone else while you were editing. 
            Please choose which version to keep.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="diff" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diff">Compare Versions</TabsTrigger>
              <TabsTrigger value="local">Your Version</TabsTrigger>
              <TabsTrigger value="server">Server Version</TabsTrigger>
            </TabsList>

            <TabsContent value="diff" className="mt-4">
              {renderDiff ? (
                renderDiff(localData, serverData)
              ) : (
                <DefaultDiffRenderer 
                  local={localData} 
                  server={serverData} 
                  formatData={formatData}
                />
              )}
            </TabsContent>

            <TabsContent value="local" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Your Version</span>
                    <Badge variant="outline">Local</Badge>
                  </div>
                  {lastModified?.local && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      Modified {formatTime(lastModified.local)}
                    </div>
                  )}
                </div>
                <ScrollArea className="h-80 w-full border rounded-md p-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {formatData(localData)}
                  </pre>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="server" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <span className="font-medium">Server Version</span>
                    <Badge variant="outline">Remote</Badge>
                  </div>
                  {lastModified?.server && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      Modified {formatTime(lastModified.server)}
                    </div>
                  )}
                </div>
                <ScrollArea className="h-80 w-full border rounded-md p-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {formatData(serverData)}
                  </pre>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <Button
              variant="outline"
              onClick={() => handleResolve(false)}
              disabled={isResolving}
              className="flex-1"
            >
              <User className="h-4 w-4 mr-2" />
              Keep My Version
            </Button>
            <Button
              variant="outline"
              onClick={() => handleResolve(true)}
              disabled={isResolving}
              className="flex-1"
            >
              <Server className="h-4 w-4 mr-2" />
              Use Server Version
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isResolving}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Specialized conflict resolution dialog for text content
 */
export function TextConflictResolutionDialog({
  open,
  onOpenChange,
  localText,
  serverText,
  onResolve,
  title = "Text Content",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localText: string;
  serverText: string;
  onResolve: (useServerVersion: boolean, text?: string) => Promise<void>;
  title?: string;
}) {
  const renderTextDiff = (local: string, server: string) => {
    const localLines = local.split('\n');
    const serverLines = server.split('\n');
    const maxLines = Math.max(localLines.length, serverLines.length);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">Your {title}</span>
              <Badge variant="outline">Local</Badge>
            </div>
            <ScrollArea className="h-64 w-full border rounded-md p-3">
              <div className="space-y-1">
                {localLines.map((line, index) => (
                  <div key={index} className="text-sm font-mono">
                    <span className="text-gray-400 mr-2 select-none">
                      {String(index + 1).padStart(3, ' ')}
                    </span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span className="font-medium">Server {title}</span>
              <Badge variant="outline">Remote</Badge>
            </div>
            <ScrollArea className="h-64 w-full border rounded-md p-3">
              <div className="space-y-1">
                {serverLines.map((line, index) => (
                  <div key={index} className="text-sm font-mono">
                    <span className="text-gray-400 mr-2 select-none">
                      {String(index + 1).padStart(3, ' ')}
                    </span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        
        {local !== server && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                The {title.toLowerCase()} versions are different. Choose which version to keep.
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ConflictResolutionDialog
      open={open}
      onOpenChange={onOpenChange}
      localData={localText}
      serverData={serverText}
      onResolve={onResolve}
      renderDiff={renderTextDiff}
      formatData={(text) => text}
    />
  );
}