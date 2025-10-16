import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image as ImageIcon, Loader2, Download, LogOut, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { extractText } from "@/lib/extract/text";

interface UploadWithPreview extends Tables<"uploads"> {
  previewUrl?: string | null;
}

const Uploads = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [uploads, setUploads] = useState<UploadWithPreview[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadingText, setUploadingText] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        void loadUploads(session.user.id);
      }
      setAuthLoading(false);
    };

    void fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        void loadUploads(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const loadUploads = async (userId: string) => {
    try {
      setLoadingUploads(true);
      const { data, error } = await supabase
        .from("uploads")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const uploadsWithPreview: UploadWithPreview[] = (data || []).map((upload) => {
        if (upload.mime_type && upload.mime_type.startsWith("image/")) {
          const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(upload.storage_path);
          return { ...upload, previewUrl: urlData.publicUrl };
        }
        return upload;
      });

      setUploads(uploadsWithPreview);
    } catch (error: any) {
      console.error("Failed to load uploads", error);
      toast.error(error.message ?? "Unable to load uploads");
    } finally {
      setLoadingUploads(false);
    }
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const generateFilePath = (fileName: string, userId: string) => {
    const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const uniqueSuffix = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `${userId}/${uniqueSuffix}-${safeName}`;
  };

  const uploadFileToSupabase = async (file: File, userId: string, extractedTextOverride?: string) => {
    const filePath = generateFilePath(file.name, userId);
    const { error: storageError } = await supabase.storage.from("uploads").upload(filePath, file);

    if (storageError) throw storageError;

    const extracted = extractedTextOverride ?? (await extractText(file));

    const { error: dbError } = await supabase.from("uploads").insert({
      user_id: userId,
      storage_path: filePath,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      extracted_text: extracted,
    });

    if (dbError) throw dbError;
  };

  const handleFileUpload = async () => {
    if (!session?.user) {
      toast.error("You must be signed in to upload files");
      return;
    }

    if (files.length === 0) {
      toast.error("Please choose at least one file");
      return;
    }

    setUploadingFiles(true);

    try {
      for (const file of files) {
        await uploadFileToSupabase(file, session.user.id);
      }

      toast.success("Files uploaded successfully");
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await loadUploads(session.user.id);
    } catch (error: any) {
      console.error("Failed to upload files", error);
      toast.error(error.message ?? "Unable to upload files");
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleTextUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.user) {
      toast.error("You must be signed in to save text uploads");
      return;
    }

    if (!textContent.trim()) {
      toast.error("Please add some text content");
      return;
    }

    setUploadingText(true);

    try {
      const title = textTitle.trim() || "Untitled Note";
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const filename = `${safeTitle || "note"}.txt`;
      const file = new File([textContent], filename, { type: "text/plain" });
      await uploadFileToSupabase(file, session.user.id, textContent);

      toast.success("Text saved successfully");
      setTextTitle("");
      setTextContent("");
      await loadUploads(session.user.id);
    } catch (error: any) {
      console.error("Failed to upload text", error);
      toast.error(error.message ?? "Unable to upload text");
    } finally {
      setUploadingText(false);
    }
  };

  const handleDownload = async (upload: Tables<"uploads">) => {
    try {
      const { data, error } = await supabase.storage.from("uploads").download(upload.storage_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = upload.original_name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Download failed", error);
      toast.error(error.message ?? "Unable to download file");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Checking your session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <h1 className="font-heading text-2xl font-bold">User Uploads</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload new content</CardTitle>
              <CardDescription>
                Bring your documents, images, and written content into your workspace. We store the file and capture the text so it can be used across the app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="files" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="files" className="gap-2">
                    <Upload className="w-4 h-4" /> Files & Images
                  </TabsTrigger>
                  <TabsTrigger value="text" className="gap-2">
                    <FileText className="w-4 h-4" /> Paste Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="files">
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <label className="cursor-pointer font-medium text-primary hover:text-primary/80">
                      Choose files to upload
                      <Input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept=".txt,.md,.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
                        onChange={handleFileSelection}
                      />
                    </label>
                    <p className="text-sm text-muted-foreground mt-2">
                      Supported formats: TXT, Markdown, PDF, Word documents, and common image files up to 10MB.
                    </p>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-6 space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Selected files ({files.length})
                      </h3>
                      <div className="space-y-2">
                        {files.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between rounded-lg border border-border bg-surface/50 px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              {file.type.startsWith("image/") ? (
                                <ImageIcon className="w-4 h-4 text-primary" />
                              ) : (
                                <FileText className="w-4 h-4 text-primary" />
                              )}
                              <div>
                                <div className="text-sm font-medium">{file.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {(file.size / 1024).toFixed(1)} KB
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleFileUpload}
                    disabled={files.length === 0 || uploadingFiles}
                    className="mt-6 w-full"
                    size="lg"
                  >
                    {uploadingFiles ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                      </>
                    ) : (
                      "Upload selected files"
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="text">
                  <form className="space-y-4" onSubmit={handleTextUpload}>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        placeholder="Give your text upload a title"
                        value={textTitle}
                        onChange={(event) => setTextTitle(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Content</label>
                      <Textarea
                        placeholder="Paste or write the content you want to store"
                        rows={6}
                        value={textContent}
                        onChange={(event) => setTextContent(event.target.value)}
                      />
                    </div>
                    <Button type="submit" disabled={uploadingText} className="w-full" size="lg">
                      {uploadingText ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving text...
                        </>
                      ) : (
                        "Save text upload"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your uploads</CardTitle>
              <CardDescription>
                Access everything you have shared with the app. Download files again or review captured text summaries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUploads ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading uploads...
                </div>
              ) : uploads.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
                  <p>No uploads yet. Start by adding files or text above.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {uploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="grid gap-4 rounded-xl border border-border bg-surface/40 p-4 md:grid-cols-[auto,1fr,auto] md:items-center"
                    >
                      <div className="flex items-center justify-center rounded-lg bg-surface w-12 h-12">
                        {upload.mime_type?.startsWith("image/") ? (
                          <ImageIcon className="w-5 h-5 text-primary" />
                        ) : (
                          <FileText className="w-5 h-5 text-primary" />
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{upload.original_name}</h3>
                          {upload.mime_type && (
                            <Badge variant="secondary">{upload.mime_type}</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {upload.created_at
                            ? new Date(upload.created_at).toLocaleString()
                            : "Unknown date"}
                          {typeof upload.size_bytes === "number" && (
                            <span className="ml-2">
                              • {(upload.size_bytes / 1024).toFixed(1)} KB
                            </span>
                          )}
                        </div>
                        {upload.extracted_text && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {upload.extracted_text}
                          </p>
                        )}
                        {upload.previewUrl && (
                          <img
                            src={upload.previewUrl}
                            alt={upload.original_name}
                            className="mt-2 max-h-48 rounded-lg object-cover"
                          />
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDownload(upload)}>
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Uploads;
