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
import { BrandTemplateRenderer } from "@/components/brand/BrandTemplateRenderer";
import {
  loadPdfExportTools,
  PDF_EXPORT_MODULE_ERROR_MESSAGE,
} from "@/lib/pdf-export";

export default function BrandView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    tagline: "",
    format_preset: "custom",
    visibility: "private",
    markdown: "",
  });
  const brandContentRef = useRef<HTMLDivElement>(null);

  const parseRawContext = (rawContext: unknown) => {
    if (!rawContext) return null;

    if (typeof rawContext === "string") {
      try {
        const parsed = JSON.parse(rawContext);
        return parsed && typeof parsed === "object" ? parsed : null;
      } catch (error) {
        console.warn("Failed to parse brand raw_context", error);
        return null;
      }
    }

    if (typeof rawContext === "object") {
      return rawContext as Record<string, unknown>;
    }

    return null;
  };

  useEffect(() => {
    loadBrand();
  }, [id]);

  const loadBrand = async () => {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setBrand({
        ...data,
        raw_context: parseRawContext(data.raw_context),
      });
    } catch (error: any) {
      console.error("Load error:", error);
      toast.error("Failed to load brand");
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

  if (!brand) return null;

  const markdown = brand.raw_context?.markdown || "# Brand Rider\n\nContent not available.";
  const editDefaults = () => {
    setEditForm({
      title: brand.title || "",
      tagline: brand.tagline || "",
      format_preset: brand.format_preset || "custom",
      visibility: brand.visibility || "private",
      markdown: brand.raw_context?.markdown || markdown,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const updatedRawContext = {
        ...(brand.raw_context || {}),
        markdown: editForm.markdown,
      };

      const { data: updatedBrand, error } = await supabase
        .from("brands")
        .update({
          title: editForm.title || null,
          tagline: editForm.tagline || null,
          format_preset: editForm.format_preset || null,
          visibility: editForm.visibility || null,
          raw_context: updatedRawContext,
          updated_at: new Date().toISOString(),
        })
        .eq("id", brand.id)
        .select()
        .single();

      if (error) throw error;

      setBrand(updatedBrand);
      toast.success("Brand updated");
      setIsEditOpen(false);
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error?.message || "Failed to update brand");
    } finally {
      setSavingEdit(false);
    }
  };

  const handlePrepareShare = async () => {
    setShareLoading(true);
    setShareCopied(false);
    try {
      const { data: existingShare, error: existingError } = await supabase
        .from("shares")
        .select("*")
        .eq("target_id", brand.id)
        .eq("kind", "brand")
        .eq("user_id", brand.user_id)
        .maybeSingle();

      if (existingError) throw existingError;

      let shareRecord = existingShare;

      if (!shareRecord) {
        const token = crypto.randomUUID().replace(/-/g, "");
        const { data: newShare, error: insertError } = await supabase
          .from("shares")
          .insert({
            kind: "brand",
            target_id: brand.id,
            token,
            user_id: brand.user_id,
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
            title: brand.title || "Brand Rider",
            text: brand.tagline || undefined,
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
    if (!brandContentRef.current) return;

    setExporting(true);
    try {
      const { html2canvas, jsPDF } = await loadPdfExportTools();

      const canvas = await html2canvas(brandContentRef.current, {
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

      const fileName = `${brand.title || "brand"}-rider.pdf`;
      pdf.save(fileName);
      toast.success("Exported brand as PDF");
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
              <Button variant="outline" size="sm" onClick={editDefaults}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
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

      <BrandTemplateRenderer ref={brandContentRef} brand={brand} markdown={markdown} />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>Update your brand details and presentation.</DialogDescription>
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
                placeholder="Brand title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={editForm.tagline}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, tagline: event.target.value }))
                }
                placeholder="High-impact tagline"
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
            <div className="space-y-2">
              <Label htmlFor="markdown">Brand Rider Markdown</Label>
              <Textarea
                id="markdown"
                className="h-48"
                value={editForm.markdown}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, markdown: event.target.value }))
                }
              />
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
            <DialogTitle>Share brand</DialogTitle>
            <DialogDescription>
              Share a read-only link to this brand presentation with collaborators.
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
              Anyone with this link can view the latest version of your Brand Rider.
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
