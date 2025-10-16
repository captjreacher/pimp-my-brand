// Configuration import dialog component
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  X
} from 'lucide-react';
import { useSystemConfig } from '@/hooks/use-system-config';
import type { ConfigExport } from '@/lib/admin/types/config-types';

interface ImportConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportConfigDialog({ open, onOpenChange }: ImportConfigDialogProps) {
  const { importConfiguration } = useSystemConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [previewData, setPreviewData] = useState<ConfigExport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setPreviewData(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ConfigExport;
      
      // Validate the import data structure
      if (!data.configs && !data.feature_flags && !data.rate_limits) {
        throw new Error('Invalid configuration file format');
      }
      
      setPreviewData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse configuration file');
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !previewData) return;

    setImporting(true);
    setImportProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      await importConfiguration(selectedFile, overwriteExisting);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      // Close dialog after a brief delay
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import configuration');
    } finally {
      setImporting(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setError(null);
    setImporting(false);
    setImportProgress(0);
    setOverwriteExisting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!importing) {
      onOpenChange(false);
      resetState();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Configuration
          </DialogTitle>
          <DialogDescription>
            Import system configuration from a previously exported file
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Selection */}
          <div>
            <Label htmlFor="config-file">Configuration File</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                id="config-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={importing}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview Data */}
          {previewData && (
            <div className="space-y-3">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Configuration Preview:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Configurations: {previewData.configs?.length || 0}</div>
                      <div>Feature Flags: {previewData.feature_flags?.length || 0}</div>
                      <div>Rate Limits: {previewData.rate_limits?.length || 0}</div>
                      <div>Exported: {formatDate(previewData.exported_at)}</div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Import Options */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={overwriteExisting}
                  onCheckedChange={setOverwriteExisting}
                  disabled={importing}
                />
                <Label>Overwrite existing configurations</Label>
              </div>
              
              {!overwriteExisting && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Existing configurations will be skipped. Enable "Overwrite existing" to replace them.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Import Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing configuration...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          )}

          {/* Success State */}
          {importProgress === 100 && !importing && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Configuration imported successfully!
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={importing}
          >
            {importing ? 'Importing...' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!previewData || importing || importProgress === 100}
          >
            {importing ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}