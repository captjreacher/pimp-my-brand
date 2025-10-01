import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { extractText, combineCorpus } from "@/lib/extract/text";

interface UploadStepProps {
  onComplete: (corpus: string, uploadIds: string[]) => void;
}

export function UploadStep({ onComplete }: UploadStepProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const uploadIds: string[] = [];
      const texts: string[] = [];

      for (const file of files) {
        // Extract text immediately
        const text = await extractText(file);
        texts.push(text);

        // Upload to storage
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: storageError } = await supabase.storage
          .from("uploads")
          .upload(filePath, file);

        if (storageError) throw storageError;

        // Create database record
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

      const corpus = combineCorpus(texts);
      toast.success("Files uploaded successfully!");
      onComplete(corpus, uploadIds);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-3xl mb-2">Upload Your Content</h2>
        <p className="text-muted">
          Upload documents that represent your voice and work
        </p>
      </div>

      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted" />
        <label className="cursor-pointer">
          <span className="text-primary hover:text-primary/80 font-medium">
            Choose files
          </span>
          <input
            type="file"
            multiple
            accept=".txt,.md,.pdf,.docx,.doc,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <p className="text-sm text-muted mt-2">
          Supports: TXT, MD, PDF, DOCX, Images
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Selected Files ({files.length})</h3>
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-surface/50 border border-border rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-muted">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(idx)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={files.length === 0 || uploading}
        className="w-full"
        size="lg"
      >
        {uploading ? "Uploading..." : "Continue"}
      </Button>
    </div>
  );
}
