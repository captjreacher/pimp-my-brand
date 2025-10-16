import * as React from "react";
import { cn } from "@/lib/utils";
import { AccessibleButton } from "./accessible-button";
import { AccessibleProgress } from "./accessible-progress";
import { Upload, FileText, Image, X, Check, AlertCircle } from "lucide-react";
import { useScreenReader } from "@/hooks/use-accessibility";

export interface TouchFileUploadProps {
  /** Accepted file types */
  accept?: string;
  /** Allow multiple files */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Maximum number of files */
  maxFiles?: number;
  /** Upload progress (0-100) */
  progress?: number;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Callback when files are selected */
  onFilesSelected?: (files: File[]) => void;
  /** Callback when file is removed */
  onFileRemoved?: (index: number) => void;
  /** Callback for upload action */
  onUpload?: () => void;
  /** Selected files */
  files?: File[];
  /** Custom upload button text */
  uploadText?: string;
  /** Custom select files text */
  selectText?: string;
  /** Help text */
  helpText?: string;
  className?: string;
}

const TouchFileUpload = React.forwardRef<HTMLDivElement, TouchFileUploadProps>(
  ({ 
    accept = "*/*",
    multiple = false,
    maxSize = 10 * 1024 * 1024, // 10MB
    maxFiles = 5,
    progress = 0,
    loading = false,
    error,
    success,
    onFilesSelected,
    onFileRemoved,
    onUpload,
    files = [],
    uploadText = "Upload Files",
    selectText = "Choose Files",
    helpText,
    className,
    ...props 
  }, ref) => {
    const { announce } = useScreenReader();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = React.useState(false);

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (file: File) => {
      if (file.type.startsWith('image/')) {
        return <Image className="w-5 h-5 text-blue-500" aria-hidden="true" />;
      }
      return <FileText className="w-5 h-5 text-primary" aria-hidden="true" />;
    };

    const validateFile = (file: File): string | null => {
      if (file.size > maxSize) {
        return `File size exceeds ${formatFileSize(maxSize)}`;
      }
      return null;
    };

    const handleFileSelect = (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const newFiles = Array.from(selectedFiles);
      const validFiles: File[] = [];
      const errors: string[] = [];

      // Validate each file
      for (const file of newFiles) {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      }

      // Check total file count
      const totalFiles = files.length + validFiles.length;
      if (totalFiles > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      if (errors.length > 0) {
        announce(`File validation errors: ${errors.join(', ')}`, 'assertive');
        return;
      }

      if (validFiles.length > 0) {
        onFilesSelected?.(validFiles);
        announce(`${validFiles.length} file${validFiles.length === 1 ? '' : 's'} selected`, 'polite');
      }
    };

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      const droppedFiles = e.dataTransfer.files;
      handleFileSelect(droppedFiles);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    };

    const handleRemoveFile = (index: number) => {
      const fileName = files[index]?.name;
      onFileRemoved?.(index);
      if (fileName) {
        announce(`Removed ${fileName}`, 'polite');
      }
    };

    return (
      <div 
        ref={ref}
        className={cn("space-y-4", className)}
        {...props}
      >
        {/* File drop zone */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-colors",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            dragActive && "border-primary bg-primary/5",
            !dragActive && "border-border hover:border-primary/50",
            loading && "pointer-events-none opacity-60"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          role="region"
          aria-label="File upload area"
        >
          <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
          
          <div className="space-y-2">
            <AccessibleButton
              type="button"
              variant="outline"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="touch-manipulation min-h-[44px]"
              aria-describedby="file-upload-help"
            >
              {selectText}
            </AccessibleButton>
            
            <p className="text-sm text-muted-foreground">
              or drag and drop files here
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            className="sr-only"
            aria-describedby="file-upload-help"
          />
        </div>

        {/* Help text */}
        {helpText && (
          <p id="file-upload-help" className="text-sm text-muted-foreground text-center">
            {helpText}
          </p>
        )}

        {/* File constraints info */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>Maximum file size: {formatFileSize(maxSize)}</p>
          <p>Maximum files: {maxFiles}</p>
        </div>

        {/* Selected files list */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Selected Files ({files.length})</h3>
            <ul className="space-y-2" role="list">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                  role="listitem"
                >
                  {getFileIcon(file)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </div>
                  </div>

                  <AccessibleButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    disabled={loading}
                    className="touch-manipulation min-h-[44px] min-w-[44px] flex-shrink-0"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </AccessibleButton>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload progress */}
        {loading && progress > 0 && (
          <AccessibleProgress
            value={progress}
            label="File upload progress"
            showPercentage
            description="Uploading your files"
          />
        )}

        {/* Status messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700" role="status">
            <Check className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Upload button */}
        {files.length > 0 && onUpload && (
          <AccessibleButton
            onClick={onUpload}
            disabled={loading || files.length === 0}
            loading={loading}
            loadingText="Uploading..."
            className="w-full touch-manipulation min-h-[44px]"
            size="lg"
          >
            {uploadText}
          </AccessibleButton>
        )}
      </div>
    );
  }
);

TouchFileUpload.displayName = "TouchFileUpload";

export { TouchFileUpload };