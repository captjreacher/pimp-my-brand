import React, { useState } from 'react';
import { AutoSaveEditor, AutoSaveTextEditor } from './AutoSaveEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BrandData {
  id?: string;
  title: string;
  tagline: string;
  bio: string;
  tone_notes: string;
  updated_at?: string;
}

/**
 * Example component demonstrating auto-save functionality for brand editing
 */
export function BrandAutoSaveExample({ brandId }: { brandId?: string }) {
  const { toast } = useToast();
  const [initialData] = useState<BrandData>({
    title: 'My Personal Brand',
    tagline: 'Innovating the future, one idea at a time',
    bio: 'I am a passionate professional with expertise in technology and innovation...',
    tone_notes: 'Professional yet approachable, confident but not arrogant',
  });

  // Save function for brand data
  const saveBrandData = async (data: BrandData): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const brandData = {
        ...data,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (brandId) {
        // Update existing brand
        const { error } = await supabase
          .from('brands')
          .update(brandData)
          .eq('id', brandId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new brand
        const { error } = await supabase
          .from('brands')
          .insert([brandData]);

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Failed to save brand:', error);
      throw new Error(`Failed to save brand: ${error.message}`);
    }
  };

  // Load function for conflict resolution
  const loadBrandData = async (): Promise<BrandData> => {
    try {
      if (!brandId) throw new Error('No brand ID provided');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Brand not found');

      return {
        id: data.id,
        title: data.title || '',
        tagline: data.tagline || '',
        bio: data.bio || '',
        tone_notes: data.tone_notes || '',
        updated_at: data.updated_at,
      };
    } catch (error: any) {
      console.error('Failed to load brand:', error);
      throw new Error(`Failed to load brand: ${error.message}`);
    }
  };

  // Custom diff renderer for brand data
  const renderBrandDiff = (local: BrandData, server: BrandData) => {
    const fields = [
      { key: 'title', label: 'Title' },
      { key: 'tagline', label: 'Tagline' },
      { key: 'bio', label: 'Bio' },
      { key: 'tone_notes', label: 'Tone Notes' },
    ] as const;

    return (
      <div className="space-y-4">
        {fields.map(({ key, label }) => {
          const localValue = local[key] || '';
          const serverValue = server[key] || '';
          const hasChange = localValue !== serverValue;

          return (
            <div key={key} className="space-y-2">
              <Label className="font-medium">{label}</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Your Version</Badge>
                    {hasChange && <Badge variant="destructive">Changed</Badge>}
                  </div>
                  <div className="p-3 border rounded-md bg-gray-50 min-h-[60px]">
                    <pre className="text-sm whitespace-pre-wrap">{localValue}</pre>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Server Version</Badge>
                    {hasChange && <Badge variant="destructive">Changed</Badge>}
                  </div>
                  <div className="p-3 border rounded-md bg-gray-50 min-h-[60px]">
                    <pre className="text-sm whitespace-pre-wrap">{serverValue}</pre>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Format brand data for conflict resolution
  const formatBrandData = (data: BrandData): string => {
    return `Title: ${data.title}
Tagline: ${data.tagline}

Bio:
${data.bio}

Tone Notes:
${data.tone_notes}

Last Updated: ${data.updated_at || 'Never'}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Auto-Save Demo</h1>
        <p className="text-gray-600">
          This demo shows auto-save functionality with conflict resolution and offline support.
        </p>
      </div>

      <Tabs defaultValue="structured" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="structured">Structured Editor</TabsTrigger>
          <TabsTrigger value="text">Text Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="structured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Editor with Auto-Save</CardTitle>
            </CardHeader>
            <CardContent>
              <AutoSaveEditor
                initialData={initialData}
                autoSaveOptions={{
                  onSave: saveBrandData,
                  onLoad: loadBrandData,
                  debounceMs: 2000,
                  showToasts: true,
                }}
                localStorageKey={`brand-editor-${brandId || 'new'}`}
                renderConflictDiff={renderBrandDiff}
                formatData={formatBrandData}
                showSaveStatus={true}
                showOfflineControls={true}
                onDataChange={(data) => {
                  console.log('Brand data changed:', data);
                }}
                onSaveStatusChange={(status) => {
                  console.log('Save status changed:', status);
                }}
              >
                {(data, onChange, isLoading) => (
                  <div className="space-y-6">
                    {isLoading && (
                      <div className="text-center py-4 text-gray-500">
                        Loading editor...
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Brand Title</Label>
                          <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => onChange({ ...data, title: e.target.value })}
                            placeholder="Enter your brand title"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tagline">Tagline</Label>
                          <Input
                            id="tagline"
                            value={data.tagline}
                            onChange={(e) => onChange({ ...data, tagline: e.target.value })}
                            placeholder="Enter your tagline"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={data.bio}
                            onChange={(e) => onChange({ ...data, bio: e.target.value })}
                            placeholder="Tell us about yourself"
                            className="min-h-[100px]"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tone">Tone Notes</Label>
                          <Textarea
                            id="tone"
                            value={data.tone_notes}
                            onChange={(e) => onChange({ ...data, tone_notes: e.target.value })}
                            placeholder="Describe your brand tone"
                            className="min-h-[100px]"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-lg">Live Preview</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold">{data.title}</h3>
                          <p className="text-gray-600 italic">{data.tagline}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">About</h4>
                          <p className="text-sm">{data.bio}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Brand Voice</h4>
                          <p className="text-sm text-gray-600">{data.tone_notes}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </AutoSaveEditor>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simple Text Editor with Auto-Save</CardTitle>
            </CardHeader>
            <CardContent>
              <AutoSaveTextEditor
                initialText="Start typing your content here. Changes will be automatically saved as you type..."
                onSave={async (text: string) => {
                  // Simulate API call
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  console.log('Saving text:', text);
                  
                  // Simulate occasional errors for testing
                  if (Math.random() < 0.1) {
                    throw new Error('Random save error for testing');
                  }
                }}
                onLoad={async () => {
                  // Simulate loading from server
                  await new Promise(resolve => setTimeout(resolve, 500));
                  return "This is the server version of the text content.";
                }}
                localStorageKey="text-editor-demo"
                placeholder="Start typing..."
                className="w-full"
                showSaveStatus={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test Auto-Save Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Auto-Save</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Start typing - changes auto-save after 2 seconds</li>
                <li>• Watch the save status indicator</li>
                <li>• Try rapid typing to see debouncing</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Offline Support</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Disconnect your internet</li>
                <li>• Continue editing - changes save locally</li>
                <li>• Reconnect to sync changes</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Conflict Resolution</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Open same document in two tabs</li>
                <li>• Edit in both tabs</li>
                <li>• See conflict resolution dialog</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Backup & Restore</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Use Export/Import buttons</li>
                <li>• Refresh page to see backup restore</li>
                <li>• Test offline backup recovery</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Simplified example for quick integration
 */
export function SimpleAutoSaveExample() {
  const [text, setText] = useState('');

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Simple Auto-Save Example</h2>
      
      <AutoSaveTextEditor
        initialText={text}
        onSave={async (content: string) => {
          // Your save logic here
          console.log('Saving:', content);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }}
        localStorageKey="simple-example"
        placeholder="Start typing to see auto-save in action..."
        showSaveStatus={true}
      />
    </div>
  );
}