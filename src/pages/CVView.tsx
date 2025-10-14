import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Download,
  Share2,
  Edit,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CVPreview } from "@/components/brand/CVPreview";
import { CVEditor } from "@/components/editing/CVEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  loadPdfExportTools,
  PDF_EXPORT_MODULE_ERROR_MESSAGE,
} from "@/lib/pdf-export";

export default function CVView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cv, setCV] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    summary: "",
    format_preset: "custom",
    visibility: "private",
  });
  const cvContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCV();
  }, [id]);

  const loadCV = async () => {
    try {
      const { data, error } = await supabase
        .from("cvs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setCV(data);
    } catch (error: any) {
      console.error("Load error:", error);
      toast.error("Failed to load CV");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (!cv) return null;

  const editDefaults = () => {
    setEditForm({
      title: cv.title || "",
      summary: cv.summary || "",
      format_preset: cv.format_preset || "custom",
      visibility: cv.visibility || "private",
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const { data: updatedCV, error } = await supabase
        .from("cvs")
        .update({
          title: editForm.title || null,
          summary: editForm.summary || null,
          format_preset: editForm.format_preset || null,
          visibility: editForm.visibility || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cv.id)
        .select()
        .single();

      if (error) throw error;

      setCV(updatedCV);
      toast.success("CV updated");
      setIsEditOpen(false);
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error?.message || "Failed to update CV");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCVChange = (updatedCV: any) => {
    setCV(updatedCV);
  };

  const handleCVSave = async (updatedCV: any) => {
    const { error } = await supabase
      .from("cvs")
      .update({
        title: updatedCV.title || null,
        summary: updatedCV.summary || null,
        experience: updatedCV.experience || [],
        skills: updatedCV.skills || [],
        links: updatedCV.links || [],
        format_preset: updatedCV.format || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cv.id);

    if (error) throw error;
  };

  const handlePrepareShare = async () => {
    setShareLoading(true);
    setShareCopied(false);
    try {
      const { data: existingShare, error: existingError } = await supabase
        .from("shares")
        .select("*")
        .eq("target_id", cv.id)
        .eq("kind", "cv")
        .eq("user_id", cv.user_id)
        .maybeSingle();

      if (existingError) throw existingError;

      let shareRecord = existingShare;

      if (!shareRecord) {
        const token = crypto.randomUUID().replace(/-/g, "");
        const { data: newShare, error: insertError } = await supabase
          .from("shares")
          .insert({
            kind: "cv",
            target_id: cv.id,
            token,
            user_id: cv.user_id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        shareRecord = newShare;
      }

      const url = `${window.location.origin}/share/${shareRecord.token}`;
      setShareLink(url);
      setIsShareOpen(true);

      if (navigator.share) {
        try {
          await navigator.share({
            title: cv.title || "Professional CV",
            text: cv.summary || undefined,
            url,
          });
        } catch (err: any) {
          if (err?.name !== "AbortError") {
            console.warn("Web Share failed:", err);
          }
        }
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Share link copied to clipboard");
        setShareCopied(true);
      }
    } catch (error: any) {
      console.error("Share error:", error);
      toast.error(error?.message || "Unable to prepare share link");
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyShare = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Share link copied");
      setShareCopied(true);
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleExportPdf = async () => {
    if (!cvContentRef.current) return;

    setExporting(true);
    try {
      const { html2canvas, jsPDF } = await loadPdfExportTools();

      const canvas = await html2canvas(cvContentRef.current, {
        scale: 2,
        useCORS: true,
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `${cv.title || "cv"}.pdf`;
      pdf.save(fileName);
      toast.success("Exported CV as PDF");
    } catch (error: any) {
      console.error("Export error:", error);
      const message =
        error?.message === PDF_EXPORT_MODULE_ERROR_MESSAGE
          ? PDF_EXPORT_MODULE_ERROR_MESSAGE
          : error?.message || "Failed to export PDF";
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Action Bar */}
      <div className="bg-surface/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTab(activeTab === "edit" ? "preview" : "edit")}
              >
                <Edit className="w-4 h-4 mr-2" />
                {activeTab === "edit" ? "Preview" : "Edit"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrepareShare}
                disabled={shareLoading}
              >
                {shareLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4 mr-2" />
                )}
                {shareLoading ? "Preparing" : "Share"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {exporting ? "Exporting" : "Export PDF"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>
          <TabsContent value="preview">
            <CVPreview ref={cvContentRef} cv={cv} />
          </TabsContent>
          <TabsContent value="edit">
            <CVEditor 
              cv={cv} 
              onChange={handleCVChange}
              onSave={handleCVSave}
            />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit CV</DialogTitle>
            <DialogDescription>Update your CV details and presentation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="CV title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Professional Summary</Label>
              <Textarea
                id="summary"
                value={editForm.summary}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, summary: event.target.value }))
                }
                placeholder="Professional summary"
                className="h-24"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Format preset</Label>
                <Select
                  value={editForm.format_preset}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, format_preset: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="ufc">UFC</SelectItem>
                    <SelectItem value="team">Team Captain</SelectItem>
                    <SelectItem value="military">Military</SelectItem>
                    <SelectItem value="nfl">NFL</SelectItem>
                    <SelectItem value="influencer">Influencer</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={editForm.visibility}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditOpen(false)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {savingEdit ? "Saving" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share CV</DialogTitle>
            <DialogDescription>
              Share a read-only link to this CV with potential employers or collaborators.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Share link</Label>
              <div className="flex items-center gap-2">
                <Input value={shareLink} readOnly />
                <Button variant="outline" size="icon" onClick={handleCopyShare}>
                  {shareCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the latest version of your CV.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsShareOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}