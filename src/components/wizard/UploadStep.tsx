import { useState } from "react";
import { Upload, FileText, X, Eye } from "lucide-react";
import { AccessibleButton } from "@/components/ui/accessible-button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MultiStepLoading } from "@/components/ui/loading-states";
import { TouchFileUpload } from "@/components/ui/touch-file-upload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { extractText, combineCorpus, requiresOCR } from "@/lib/extract/text";
import { useScreenReader, useAccessibleLoading } from "@/hooks/use-accessibility";
import { useMultiStepLoading } from "@/hooks/use-loading-state";
import type { OCROptions } from "@/lib/extract/file-processor";

interface UploadStepProps {
  onComplete: (corpus: string, uploadIds: string[]) => void;
}

export function UploadStep({ onComplete }: UploadStepProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [ocrEnabled, setOcrEnabled] = useState(true);
  const { announce } = useScreenReader();
  
  // Multi-step loading for file processing
  const multiStepLoading = useMultiStepLoading([
    { id: 'validate', label: 'Validating files' },
    { id: 'extract', label: 'Extracting text content' },
    { id: 'upload', label: 'Uploading to storage' },
    { id: 'save', label: 'Saving to database' }
  ]);

  const loadingAttributes = useAccessibleLoading(
    multiStepLoading.steps.some(step => step.status === 'loading'),
    'Processing files...'
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
      announce(`${newFiles.length} file${newFiles.length === 1 ? '' : 's'} selected for upload`, 'polite');
    }
  };

  const removeFile = (index: number) => {
    const fileName = files[index]?.name;
    setFiles(files.filter((_, i) => i !== index));
    if (fileName) {
      announce(`Removed ${fileName} from upload queue`, 'polite');
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    multiStepLoading.reset();
    
    try {
      // Step 1: Validate files
      multiStepLoading.setStepStatus('validate', 'loading', 'Checking file types and sizes...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate all files
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`File ${file.name} exceeds 10MB limit`);
        }
      }
      
      multiStepLoading.setStepStatus('validate', 'complete', 'All files validated');

      // Step 2: Extract text content
      multiStepLoading.setStepStatus('extract', 'loading', 'Processing file content...');
      
      const uploadIds: string[] = [];
      const texts: string[] = [];
      const ocrOptions: OCROptions = {
        enabled: ocrEnabled,
        language: 'eng'
      };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const progressMessage = `Processing ${file.name} (${i + 1}/${files.length})`;
          multiStepLoading.setStepStatus('extract', 'loading', progressMessage);
          
          if (requiresOCR(file) && ocrEnabled) {
            announce(`Processing ${file.name} with OCR`, 'polite');
          } else {
            announce(`Extracting text from ${file.name}`, 'polite');
          }

          // Extract text with OCR options
          const text = await extractText(file, ocrOptions);
          texts.push(text);
          
          announce(`Successfully processed ${file.name}`, 'polite');
        } catch (fileError: any) {
          console.error(`Error processing ${file.name}:`, fileError);
          announce(`Error processing ${file.name}: ${fileError.message}`, 'assertive');
          // Continue with other files instead of failing completely
          texts.push(`[Error processing ${file.name}: ${fileError.message}]`);
        }
      }
      
      multiStepLoading.setStepStatus('extract', 'complete', `Processed ${files.length} files`);

      // Step 3: Upload to storage
      multiStepLoading.setStepStatus('upload', 'loading', 'Uploading files to storage...');
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progressMessage = `Uploading ${file.name} (${i + 1}/${files.length})`;
        multiStepLoading.setStepStatus('upload', 'loading', progressMessage);
        
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: storageError } = await supabase.storage
          .from("uploads")
          .upload(filePath, file);

        if (storageError) throw storageError;
      }
      
      multiStepLoading.setStepStatus('upload', 'complete', 'All files uploaded');

      // Step 4: Save to database
      multiStepLoading.setStepStatus('save', 'loading', 'Saving file records...');
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = texts[i];
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        
        const { data: upload, error: dbError } = await supabase
          .from("uploads")
          .insert({
            user_id: user.id,
            storage_path: filePath,
            original_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            extracted_text: text,
          })
          .select()
          .single();

        if (dbError) throw dbError;
        uploadIds.push(upload.id);
      }
      
      multiStepLoading.setStepStatus('save', 'complete', 'All records saved');

      const corpus = combineCorpus(texts);
      toast.success("Files uploaded successfully!");
      onComplete(corpus, uploadIds);
    } catch (error: any) {
      console.error("Upload error:", error);
      
      // Mark current step as error
      const currentStep = multiStepLoading.steps.find(step => step.status === 'loading');
      if (currentStep) {
        multiStepLoading.setStepStatus(currentStep.id, 'error', error.message);
      }
      
      toast.error(error.message || "Failed to upload files");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-3xl mb-2">Upload Your Content</h2>
        <p className="text-muted-foreground">
          Upload documents that represent your voice and work
        </p>
      </div>

      <div 
        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        role="region"
        aria-label="File upload area"
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
        <label className="cursor-pointer">
          <span className="text-primary hover:text-primary/80 font-medium">
            Choose files
          </span>
          <input
            type="file"
            multiple
            accept=".txt,.md,.pdf,.docx,.doc,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="sr-only"
            aria-describedby="file-upload-help"
          />
        </label>
        <p id="file-upload-help" className="text-sm text-muted-foreground mt-2">
          Supports: TXT, MD, PDF, DOCX, Images. Multiple files allowed.
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-4" role="region" aria-label="Selected files">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Selected Files ({files.length})</h3>
            {files.some(file => requiresOCR(file)) && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="ocr-enabled"
                  checked={ocrEnabled}
                  onCheckedChange={(checked) => {
                    setOcrEnabled(checked);
                    announce(
                      `OCR ${checked ? 'enabled' : 'disabled'} for image files`,
                      'polite'
                    );
                  }}
                  aria-describedby="ocr-help"
                />
                <Label htmlFor="ocr-enabled" className="text-sm">
                  <Eye className="w-4 h-4 inline mr-1" aria-hidden="true" />
                  Enable OCR for images
                </Label>
              </div>
            )}
          </div>
          <p id="ocr-help" className="text-xs text-muted-foreground">
            OCR (Optical Character Recognition) extracts text from image files
          </p>
          
          <ul className="space-y-2" role="list">
            {files.map((file, idx) => {
              const needsOCR = requiresOCR(file);
              
              return (
                <li
                  key={idx}
                  className="flex items-center justify-between bg-surface/50 border border-border rounded-lg p-3"
                  role="listitem"
                >
                  <div className="flex items-center gap-3">
                    {needsOCR ? (
                      <Eye className="w-4 h-4 text-blue-500" aria-label="Image file" />
                    ) : (
                      <FileText className="w-4 h-4 text-primary" aria-label="Document file" />
                    )}
                    <div>
                      <div className="text-sm font-medium">{file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                        {needsOCR && (
                          <span className="ml-2 text-blue-500">
                            {ocrEnabled ? "• OCR enabled" : "• OCR disabled"}
                          </span>
                        )}
                      </div>
                      {/* Status will be shown in multi-step loading instead */}
                    </div>
                  </div>
                  <AccessibleButton
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(idx)}
                    disabled={multiStepLoading.steps.some(step => step.status === 'loading')}
                    aria-label={`Remove ${file.name} from upload queue`}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </AccessibleButton>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Multi-step loading progress */}
      {multiStepLoading.steps.some(step => step.status !== 'pending') && (
        <div className="space-y-4">
          <MultiStepLoading steps={multiStepLoading.steps} />
        </div>
      )}

      <AccessibleButton
        onClick={handleUpload}
        disabled={files.length === 0 || multiStepLoading.steps.some(step => step.status === 'loading')}
        loading={multiStepLoading.steps.some(step => step.status === 'loading')}
        loadingText="Processing files..."
        className="w-full"
        size="lg"
        aria-describedby={files.length === 0 ? "upload-help" : undefined}
        {...loadingAttributes}
      >
        {multiStepLoading.steps.some(step => step.status === 'loading') ? "Processing..." : "Continue"}
      </AccessibleButton>
      
      {files.length === 0 && (
        <p id="upload-help" className="text-sm text-muted-foreground text-center">
          Please select at least one file to continue
        </p>
      )}
    </div>
  );
}
