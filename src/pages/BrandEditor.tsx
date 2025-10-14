import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, 
  Save, 
  Eye, 
  Palette, 
  Type, 
  FileText, 
  Settings,
  Loader2,
  Plus,
  X,
  Sparkles,
  Globe,
  Lock
} from "lucide-react";
import { BrandTemplateRenderer } from "@/components/brand/BrandTemplateRenderer";

interface Brand {
  id: string;
  title: string | null;
  tagline: string | null;
  tone_notes: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  signature_phrases: string[] | null;
  color_palette: any;
  fonts: any;
  logo_url: string | null;
  bio: string | null;
  format_preset: string | null;
  visibility: string | null;
  raw_context: any;
}

export default function BrandEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [markdown, setMarkdown] = useState("");
  const [newStrength, setNewStrength] = useState("");
  const [newWeakness, setNewWeakness] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  
  const brandContentRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    tone_notes: "",
    bio: "",
    format_preset: "custom",
    visibility: "private",
    strengths: [] as string[],
    weaknesses: [] as string[],
    signature_phrases: [] as string[],
    color_palette: null,
    fonts: null,
    logo_url: ""
  });

  useEffect(() => {
    if (id) {
      fetchBrand();
    }
  }, [id]);

  const fetchBrand = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setBrand(data);
      setFormData({
        title: data.title || "",
        tagline: data.tagline || "",
        tone_notes: data.tone_notes || "",
        bio: data.bio || "",
        format_preset: data.format_preset || "custom",
        visibility: data.visibility || "private",
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        signature_phrases: data.signature_phrases || [],
        color_palette: data.color_palette,
        fonts: data.fonts,
        logo_url: data.logo_url || ""
      });

      // Generate markdown for preview
      generateMarkdown(data);
    } catch (error: any) {
      console.error("Error fetching brand:", error);
      toast.error("Failed to load brand");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const generateMarkdown = async (brandData: Brand) => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-brand", {
        body: {
          extractedText: brandData.raw_context?.extractedText || "",
          format: brandData.format_preset || "custom",
          userProfile: {
            name: brandData.title,
            bio: brandData.bio
          }
        },
      });

      if (error) throw error;
      setMarkdown(data.markdown || "");
    } catch (error) {
      console.error("Error generating markdown:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addListItem = (field: 'strengths' | 'weaknesses' | 'signature_phrases', value: string) => {
    if (!value.trim()) return;
    
    const currentList = formData[field];
    if (!currentList.includes(value.trim())) {
      handleInputChange(field, [...currentList, value.trim()]);
    }
    
    // Clear the input
    if (field === 'strengths') setNewStrength("");
    if (field === 'weaknesses') setNewWeakness("");
    if (field === 'signature_phrases') setNewPhrase("");
  };

  const removeListItem = (field: 'strengths' | 'weaknesses' | 'signature_phrases', index: number) => {
    const currentList = formData[field];
    handleInputChange(field, currentList.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!id || !brand) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("brands")
        .update({
          title: formData.title,
          tagline: formData.tagline,
          tone_notes: formData.tone_notes,
          bio: formData.bio,
          format_preset: formData.format_preset,
          visibility: formData.visibility,
          strengths: formData.strengths,
          weaknesses: formData.weaknesses,
          signature_phrases: formData.signature_phrases,
          logo_url: formData.logo_url,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      // Regenerate markdown with updated data
      const updatedBrand = { ...brand, ...formData };
      await generateMarkdown(updatedBrand);

      toast.success("Brand updated successfully");
    } catch (error: any) {
      console.error("Error saving brand:", error);
      toast.error("Failed to save brand");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    navigate(`/brand/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading brand editor...</p>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Brand not found</h1>
          <Button onClick={() => navigate("/dashboard")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(`/brand/${id}`)}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Brand
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-semibold">Edit Brand</h1>
                <p className="text-sm text-muted-foreground">
                  {formData.title || "Untitled Brand"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {formData.visibility === 'public' ? (
                  <>
                    <Globe className="h-4 w-4" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Private
                  </>
                )}
              </div>
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-12rem)]">
          {/* Editor Panel */}
          <div className="space-y-6 overflow-y-auto pr-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="style" className="gap-2">
                  <Palette className="h-4 w-4" />
                  Style
                </TabsTrigger>
                <TabsTrigger value="voice" className="gap-2">
                  <Type className="h-4 w-4" />
                  Voice
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Brand Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter your brand title"
                        className="text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        value={formData.tagline}
                        onChange={(e) => handleInputChange('tagline', e.target.value)}
                        placeholder="A compelling tagline that captures your essence"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Brand Story</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Tell your brand story..."
                        className="h-32"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Brand Strengths</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {formData.strengths.map((strength, index) => (
                        <Badge key={index} variant="default" className="gap-1">
                          {strength}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeListItem('strengths', index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newStrength}
                        onChange={(e) => setNewStrength(e.target.value)}
                        placeholder="Add a strength"
                        onKeyPress={(e) => e.key === 'Enter' && addListItem('strengths', newStrength)}
                      />
                      <Button 
                        onClick={() => addListItem('strengths', newStrength)}
                        disabled={!newStrength.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Areas for Growth</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {formData.weaknesses.map((weakness, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {weakness}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeListItem('weaknesses', index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newWeakness}
                        onChange={(e) => setNewWeakness(e.target.value)}
                        placeholder="Add an area for improvement"
                        onKeyPress={(e) => e.key === 'Enter' && addListItem('weaknesses', newWeakness)}
                      />
                      <Button 
                        onClick={() => addListItem('weaknesses', newWeakness)}
                        disabled={!newWeakness.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="voice" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Signature Phrases</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {formData.signature_phrases.map((phrase, index) => (
                        <Badge key={index} variant="outline" className="gap-1">
                          "{phrase}"
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeListItem('signature_phrases', index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newPhrase}
                        onChange={(e) => setNewPhrase(e.target.value)}
                        placeholder="Add a signature phrase"
                        onKeyPress={(e) => e.key === 'Enter' && addListItem('signature_phrases', newPhrase)}
                      />
                      <Button 
                        onClick={() => addListItem('signature_phrases', newPhrase)}
                        disabled={!newPhrase.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tone & Voice Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={formData.tone_notes}
                      onChange={(e) => handleInputChange('tone_notes', e.target.value)}
                      placeholder="Describe your brand's tone of voice, communication style, and personality..."
                      className="h-40"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="style" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Visual Identity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <Input
                        id="logo_url"
                        value={formData.logo_url}
                        onChange={(e) => handleInputChange('logo_url', e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    {formData.logo_url && (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <img 
                          src={formData.logo_url} 
                          alt="Brand logo" 
                          className="max-h-24 mx-auto"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Color Palette & Typography
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Visual styling is automatically generated based on your format preset and content. 
                      Advanced customization options coming soon.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Presentation Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Format Preset</Label>
                      <Select
                        value={formData.format_preset}
                        onValueChange={(value) => handleInputChange('format_preset', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom</SelectItem>
                          <SelectItem value="ufc">UFC Fighter</SelectItem>
                          <SelectItem value="team">Team Captain</SelectItem>
                          <SelectItem value="military">Military</SelectItem>
                          <SelectItem value="nfl">NFL Player</SelectItem>
                          <SelectItem value="influencer">Influencer</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                          <SelectItem value="artist">Artist</SelectItem>
                          <SelectItem value="humanitarian">Humanitarian</SelectItem>
                          <SelectItem value="creator">Content Creator</SelectItem>
                          <SelectItem value="fashion">Fashion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Visibility</Label>
                      <Select
                        value={formData.visibility}
                        onValueChange={(value) => handleInputChange('visibility', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              Private - Only you can see this
                            </div>
                          </SelectItem>
                          <SelectItem value="public">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Public - Anyone with the link can view
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="border rounded-lg bg-muted/20 overflow-hidden">
            <div className="border-b bg-background px-4 py-3">
              <h3 className="font-medium">Live Preview</h3>
              <p className="text-sm text-muted-foreground">
                See how your brand will look to others
              </p>
            </div>
            <div className="h-full overflow-y-auto p-6">
              {markdown && brand ? (
                <BrandTemplateRenderer 
                  ref={brandContentRef} 
                  brand={{...brand, ...formData}} 
                  markdown={markdown} 
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Generating preview...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}