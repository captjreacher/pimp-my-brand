import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Camera, 
  Crop, 
  Plus, 
  X, 
  Globe, 
  Lock, 
  Users, 
  Eye,
  Linkedin,
  Twitter,
  Github,
  Instagram,
  Youtube,
  Facebook
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type ProfileData = Tables<'profiles'>;

interface SocialLink {
  platform: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
}

const SOCIAL_PLATFORMS: SocialLink[] = [
  {
    platform: 'linkedin',
    url: 'https://linkedin.com/in/',
    icon: Linkedin,
    placeholder: 'your-linkedin-username'
  },
  {
    platform: 'twitter',
    url: 'https://twitter.com/',
    icon: Twitter,
    placeholder: 'your-twitter-handle'
  },
  {
    platform: 'github',
    url: 'https://github.com/',
    icon: Github,
    placeholder: 'your-github-username'
  },
  {
    platform: 'instagram',
    url: 'https://instagram.com/',
    icon: Instagram,
    placeholder: 'your-instagram-handle'
  },
  {
    platform: 'youtube',
    url: 'https://youtube.com/@',
    icon: Youtube,
    placeholder: 'your-youtube-channel'
  },
  {
    platform: 'facebook',
    url: 'https://facebook.com/',
    icon: Facebook,
    placeholder: 'your-facebook-page'
  }
];

const ROLE_TAGS = [
  'Creator', 'Entrepreneur', 'Developer', 'Designer', 'Writer', 'Speaker',
  'Consultant', 'Coach', 'Athlete', 'Artist', 'Musician', 'Photographer',
  'Marketer', 'Executive', 'Founder', 'Investor', 'Influencer', 'Educator'
];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Entertainment',
  'Sports', 'Fashion', 'Food & Beverage', 'Travel', 'Real Estate',
  'Automotive', 'Gaming', 'Media', 'Non-profit', 'Government', 'Other'
];

interface AdvancedProfileEditorProps {
  profile: ProfileData;
  onSave: (updatedProfile: Partial<ProfileData>) => Promise<void>;
  isLoading?: boolean;
}

export const AdvancedProfileEditor = ({ profile, onSave, isLoading }: AdvancedProfileEditorProps) => {
  const [formData, setFormData] = useState<ProfileData>(profile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedRoleTags, setSelectedRoleTags] = useState<string[]>(profile.role_tags || []);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>((profile.socials as Record<string, string>) || {});
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback((field: keyof ProfileData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleAvatarUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setShowCropper(true);
  }, []);

  const handleCropComplete = useCallback(() => {
    setShowCropper(false);
    toast.success('Avatar updated');
  }, []);

  const handleAddRoleTag = useCallback((tag: string) => {
    if (!selectedRoleTags.includes(tag) && selectedRoleTags.length < 5) {
      const newTags = [...selectedRoleTags, tag];
      setSelectedRoleTags(newTags);
      handleInputChange('role_tags', newTags);
    }
  }, [selectedRoleTags, handleInputChange]);

  const handleRemoveRoleTag = useCallback((tag: string) => {
    const newTags = selectedRoleTags.filter(t => t !== tag);
    setSelectedRoleTags(newTags);
    handleInputChange('role_tags', newTags);
  }, [selectedRoleTags, handleInputChange]);

  const handleSocialLinkChange = useCallback((platform: string, value: string) => {
    const newSocials = { ...socialLinks, [platform]: value };
    setSocialLinks(newSocials);
    handleInputChange('socials', newSocials);
  }, [socialLinks, handleInputChange]);

  const handleRemoveSocialLink = useCallback((platform: string) => {
    const newSocials = { ...socialLinks };
    delete newSocials[platform];
    setSocialLinks(newSocials);
    handleInputChange('socials', newSocials);
  }, [socialLinks, handleInputChange]);

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${profile.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
      return null;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      let avatarUrl = formData.avatar_url;
      
      // Upload new avatar if one was selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      const updatedProfile: Partial<ProfileData> = {
        display_name: formData.display_name,
        handle: formData.handle,
        avatar_url: avatarUrl,
        bio: formData.bio,
        role_tags: formData.role_tags,
        website_url: formData.website_url,
        socials: formData.socials,
        visibility: formData.visibility
      };

      await onSave(updatedProfile);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Photo
          </CardTitle>
          <CardDescription>
            Upload a professional photo that represents your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-border">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt={formData.display_name || 'Profile'} />
                ) : (
                  <AvatarFallback className="text-lg">
                    {formData.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <Button
                size="sm"
                variant="secondary"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Upload new photo</h3>
              <p className="text-sm text-muted-foreground mt-1">
                JPG, PNG or GIF. Max size 5MB. Square images work best.
              </p>
              {showCropper && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 gap-2"
                  onClick={handleCropComplete}
                >
                  <Crop className="h-4 w-4" />
                  Crop & Save
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Your public profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name || ''}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                value={formData.handle || ''}
                onChange={(e) => handleInputChange('handle', e.target.value)}
                placeholder="your-unique-handle"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                This will be your unique URL: /profile/your-handle
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell people about yourself and what you do..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {(formData.bio || '').length}/500 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_url">Website</Label>
            <Input
              id="website_url"
              type="url"
              value={formData.website_url || ''}
              onChange={(e) => handleInputChange('website_url', e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
          <CardDescription>
            Help others understand your expertise and industry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Role Tags (max 5)</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedRoleTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveRoleTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {ROLE_TAGS.filter(tag => !selectedRoleTags.includes(tag)).map((tag) => (
                <Button
                  key={tag}
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => handleAddRoleTag(tag)}
                  disabled={selectedRoleTags.length >= 5}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>
            Connect your social media profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SOCIAL_PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const currentValue = socialLinks[platform.platform] || '';
            
            return (
              <div key={platform.platform} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-32">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium capitalize">
                    {platform.platform}
                  </span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {platform.url}
                  </span>
                  <Input
                    value={currentValue}
                    onChange={(e) => handleSocialLinkChange(platform.platform, e.target.value)}
                    placeholder={platform.placeholder}
                    className="flex-1"
                  />
                  {currentValue && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveSocialLink(platform.platform)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy & Visibility</CardTitle>
          <CardDescription>
            Control who can see your profile and content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {formData.visibility === 'public' ? (
                  <Globe className="h-4 w-4 text-green-600" />
                ) : (
                  <Lock className="h-4 w-4 text-orange-600" />
                )}
                <span className="font-medium">
                  {formData.visibility === 'public' ? 'Public Profile' : 'Private Profile'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {formData.visibility === 'public' 
                  ? 'Your profile is visible to everyone and appears in search results'
                  : 'Your profile is only visible to you and people you share it with'
                }
              </p>
            </div>
            <Switch
              checked={formData.visibility === 'public'}
              onCheckedChange={(checked) => 
                handleInputChange('visibility', checked ? 'public' : 'private')
              }
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Profile Visibility Settings
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Public profiles appear in the community gallery</p>
              <p>• Public profiles can be found via search engines</p>
              <p>• You can always change this setting later</p>
              <p>• Individual brand materials have their own privacy settings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || isLoading}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </>
          ) : (
            'Save Profile'
          )}
        </Button>
      </div>
    </div>
  );
};