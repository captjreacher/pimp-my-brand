import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Sparkles, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LogoStepProps {
  brandData: any;
  onComplete: (logoUrl: string | null) => void;
  onSkip: () => void;
}

export function LogoStep({ brandData, onComplete, onSkip }: LogoStepProps) {
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description for your logo");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-logo", {
        body: { 
          prompt: prompt.trim(),
          brandName: brandData.tagline || "Brand",
          colorPalette: brandData.color_palette
        },
      });

      if (error) throw error;
      
      const imageUrl = data.imageUrl;
      setLogoUrl(imageUrl);
      toast.success("Logo generated!");
    } catch (error: any) {
      console.error("Logo generation error:", error);
      toast.error(error.message || "Failed to generate logo");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("logos")
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      toast.success("Logo uploaded!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-3xl mb-2">Add Your Logo</h2>
        <p className="text-muted-foreground">
          Generate with AI, upload your own, or skip this step
        </p>
      </div>

      {/* Preview */}
      {logoUrl && (
        <div className="bg-surface/50 border border-border rounded-xl p-8 text-center">
          <img 
            src={logoUrl} 
            alt="Logo preview" 
            className="max-h-48 mx-auto rounded-lg"
          />
        </div>
      )}

      {/* Generate Section */}
      <div className="bg-surface/50 border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-heading font-semibold">Generate with AI</h3>
        </div>
        <Input
          placeholder="Describe your logo (e.g., minimalist mountain peak, tech startup vibe)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={generating}
        />
        <Button 
          onClick={handleGenerate} 
          disabled={generating || !prompt.trim()}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Logo
            </>
          )}
        </Button>
      </div>

      {/* Upload Section */}
      <div className="bg-surface/50 border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Upload className="w-5 h-5" />
          <h3 className="font-heading font-semibold">Upload Your Own</h3>
        </div>
        <label className="block">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id="logo-upload"
          />
          <Button 
            variant="outline" 
            className="w-full" 
            disabled={uploading}
            onClick={() => (document.getElementById('logo-upload') as HTMLInputElement)?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Choose File
              </>
            )}
          </Button>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => onSkip()}
          className="flex-1"
        >
          Skip for Now
        </Button>
        <Button 
          onClick={() => onComplete(logoUrl)}
          disabled={!logoUrl}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
