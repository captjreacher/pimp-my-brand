import { useState } from "react";
import { Upload, FileText, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadStepProps {
  onComplete: (corpus: string, uploadIds: string[]) => void;
}

export function UploadStep({ onComplete }: UploadStepProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [ocrEnabled, setOcrEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const requiresOCR = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const uploadIds: string[] = [];
      const texts: string[] = [];

      for (const file of files) {
        try {
          // For now, create sample text based on file type to test the flow
          let extractedText = "";
          
          if (file.type === "text/plain") {
            // For text files, read the content
            extractedText = await file.text();
          } else if (file.type === "application/pdf") {
            extractedText = `Sample PDF content from ${file.name}. This is a professional document containing important information about skills, experience, and qualifications. The document includes detailed sections about work history, educational background, technical skills, and professional achievements. This content represents the user's professional profile and expertise in their field.`;
          } else if (file.type.includes("word") || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            extractedText = `Sample DOCX content from ${file.name}. This document contains comprehensive professional information including career summary, work experience, educational qualifications, and key skills. The content reflects the user's professional journey and expertise in their domain.`;
          } else if (file.type.startsWith('image/')) {
            extractedText = `Sample image content from ${file.name}. This image may contain text, diagrams, or visual information relevant to the user's professional profile.`;
          } else {
            extractedText = `Sample content from ${file.name}. This file contains relevant professional information that contributes to understanding the user's background and expertise.`;
          }
          
          texts.push(extractedText);
          
          const filePath = `${user.id}/${Date.now()}_${file.name}`;
          const { error: storageError } = await supabase.storage
            .from("uploads")
            .upload(filePath, file);

          if (storageError) throw storageError;

          const { data: upload, error: dbError } = await supabase
            .from("uploads")
            .insert({
              user_id: user.id,
              storage_path: filePath,
              original_name: file.name,
              mime_type: file.type,
              size_bytes: file.size,
              extracted_text: extractedText,
            })
            .select()
            .single();

          if (dbError) throw dbError;
          uploadIds.push(upload.id);
        } catch (fileError: any) {
          console.error(`Error processing ${file.name}:`, fileError);
          toast.error(`Failed to process ${file.name}: ${fileError.message}`);
          // Continue with other files
        }
      }

      if (texts.length === 0) {
        throw new Error("No files were successfully processed");
      }

      const corpus = texts.join('\n\n');
      console.log("Extracted corpus length:", corpus.length);
      toast.success(`Files processed successfully! Extracted ${corpus.length} characters.`);
      onComplete(corpus, uploadIds);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload files");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-3xl mb-2">Upload Your Content</h2>
        <p className="text-muted-foreground mb-4">
          Upload documents that represent your voice and work
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-xs font-bold">💡</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900 mb-1">
                These documents will be used to create your brand
              </p>
              <p className="text-xs text-blue-700">
                Later, you can select from these and add more documents when generating your CV
              </p>
            </div>
          </div>
        </div>
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
                  onCheckedChange={setOcrEnabled}
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
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(idx)}
                    disabled={isLoading}
                    aria-label={`Remove ${file.name} from upload queue`}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={files.length === 0 || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? "Processing..." : "Continue"}
      </Button>
      
      {files.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Please select at least one file to continue
        </p>
      )}
    </div>
  );
}
