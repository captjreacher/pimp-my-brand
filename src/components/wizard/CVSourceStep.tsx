import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Upload, 
  Search, 
  Calendar, 
  Eye,
  Plus,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface CVSourceStepProps {
  brandCorpus: string;
  brandUploadIds: string[];
  onComplete: (selectedUploadIds: string[], additionalCorpus: string) => void;
}

interface Upload {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  extracted_text: string;
  created_at: string;
  updated_at?: string;
  storage_path: string;
  user_id: string;
  visibility: string;
}

export function CVSourceStep({ brandCorpus, brandUploadIds, onComplete }: CVSourceStepProps) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [selectedUploadIds, setSelectedUploadIds] = useState<string[]>(brandUploadIds);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("existing");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUserUploads();
  }, []);

  const fetchUserUploads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("uploads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (error: any) {
      console.error("Error fetching uploads:", error);
      toast.error("Failed to load your uploads");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewFiles(files);
    }
  };

  const handleUploadNewFiles = async () => {
    if (newFiles.length === 0) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const newUploadIds: string[] = [];

      for (const file of newFiles) {
        try {
          // Simple text extraction for now
          let extractedText = "";
          if (file.type === "text/plain") {
            extractedText = await file.text();
          } else {
            extractedText = `Content from ${file.name} - professional document with relevant CV information.`;
          }

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
          newUploadIds.push(upload.id);
        } catch (fileError: any) {
          console.error(`Error processing ${file.name}:`, fileError);
          toast.error(`Failed to process ${file.name}`);
        }
      }

      if (newUploadIds.length > 0) {
        // Add new uploads to selected list
        setSelectedUploadIds(prev => [...prev, ...newUploadIds]);
        // Refresh uploads list
        await fetchUserUploads();
        toast.success(`${newUploadIds.length} files uploaded successfully`);
        setNewFiles([]);
        setActiveTab("existing");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadSelect = (uploadId: string, selected: boolean) => {
    if (selected) {
      setSelectedUploadIds(prev => [...prev, uploadId]);
    } else {
      setSelectedUploadIds(prev => prev.filter(id => id !== uploadId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUploadIds(filteredUploads.map(upload => upload.id));
    } else {
      setSelectedUploadIds([]);
    }
  };

  const handleContinue = () => {
    const selectedUploads = uploads.filter(upload => selectedUploadIds.includes(upload.id));
    const additionalCorpus = selectedUploads
      .filter(upload => !brandUploadIds.includes(upload.id))
      .map(upload => upload.extracted_text)
      .join('\n\n');

    onComplete(selectedUploadIds, additionalCorpus);
  };

  const filteredUploads = uploads.filter(upload => {
    const query = searchQuery.toLowerCase();
    return upload.original_name.toLowerCase().includes(query) ||
           upload.extracted_text.toLowerCase().includes(query);
  });

  const brandUploads = uploads.filter(upload => brandUploadIds.includes(upload.id));
  const otherUploads = uploads.filter(upload => !brandUploadIds.includes(upload.id));
  const selectedCount = selectedUploadIds.length;
  const totalTextLength = uploads
    .filter(upload => selectedUploadIds.includes(upload.id))
    .reduce((total, upload) => total + upload.extracted_text.length, 0);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your uploads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            <FileText className="w-4 h-4" />
            CV Generation - Step 2 of 2
          </div>
        </div>
        <h2 className="font-heading text-3xl mb-2">Select CV Sources</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose which documents to use for generating your CV. Your brand documents are already selected, 
          but you can add more files or upload new ones for a more comprehensive CV.
        </p>
      </div>

      {/* Selection Summary */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-sm">
                {selectedCount} document{selectedCount !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-muted-foreground">
                {totalTextLength.toLocaleString()} characters of content
              </p>
              {selectedCount > 0 && (
                <p className="text-xs text-primary mt-1">
                  Ready to generate your professional CV ✨
                </p>
              )}
            </div>
          </div>
          <Button 
            onClick={handleContinue}
            disabled={selectedCount === 0}
            className="gap-2"
            size="lg"
          >
            Generate CV
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing">Your Documents ({uploads.length})</TabsTrigger>
          <TabsTrigger value="upload">Upload New</TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-4">
          {/* Search and Select All */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search your documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(selectedUploadIds.length !== filteredUploads.length)}
            >
              {selectedUploadIds.length === filteredUploads.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Brand Documents Section */}
          {brandUploads.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">Brand Documents</Badge>
                <span className="text-sm text-muted-foreground">
                  Used to create your brand (automatically included)
                </span>
                <div className="ml-auto">
                  <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1">
                    <span className="text-xs text-blue-700 font-medium">
                      ✓ Pre-selected for consistency
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid gap-3">
                {brandUploads.map((upload) => (
                  <UploadCard
                    key={upload.id}
                    upload={upload}
                    isSelected={selectedUploadIds.includes(upload.id)}
                    onSelect={(selected) => handleUploadSelect(upload.id, selected)}
                    isBrandDocument={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Documents Section */}
          {otherUploads.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Other Documents</Badge>
                <span className="text-sm text-muted-foreground">
                  Additional files you can include
                </span>
              </div>
              <div className="grid gap-3">
                {otherUploads
                  .filter(upload => {
                    const query = searchQuery.toLowerCase();
                    return upload.original_name.toLowerCase().includes(query) ||
                           upload.extracted_text.toLowerCase().includes(query);
                  })
                  .map((upload) => (
                    <UploadCard
                      key={upload.id}
                      upload={upload}
                      isSelected={selectedUploadIds.includes(upload.id)}
                      onSelect={(selected) => handleUploadSelect(upload.id, selected)}
                      isBrandDocument={false}
                    />
                  ))}
              </div>
            </div>
          )}

          {uploads.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                Upload some documents to get started with CV generation.
              </p>
              <Button onClick={() => setActiveTab("upload")}>
                Upload Documents
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <label className="cursor-pointer">
              <span className="text-primary hover:text-primary/80 font-medium">
                Choose additional files
              </span>
              <input
                type="file"
                multiple
                accept=".txt,.md,.pdf,.docx,.doc,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
            <p className="text-sm text-muted-foreground mt-2">
              Upload resumes, cover letters, or other professional documents
            </p>
          </div>

          {newFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Files to Upload ({newFiles.length})</h3>
              <div className="space-y-2">
                {newFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.type} • {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewFiles(files => files.filter((_, i) => i !== index))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <Button 
                onClick={handleUploadNewFiles}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? "Uploading..." : `Upload ${newFiles.length} File${newFiles.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface UploadCardProps {
  upload: Upload;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  isBrandDocument: boolean;
}

function UploadCard({ upload, isSelected, onSelect, isBrandDocument }: UploadCardProps) {
  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <Card className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <h3 className="font-medium text-sm truncate">{upload.original_name}</h3>
              {isBrandDocument && (
                <Badge variant="default" className="text-xs">Brand</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {upload.mime_type} • {formatFileSize(upload.size_bytes)} • {upload.extracted_text.length} chars
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {upload.extracted_text.substring(0, 150)}...
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(upload.updated_at || upload.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}