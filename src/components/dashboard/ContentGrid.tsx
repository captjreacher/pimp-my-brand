import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Download, 
  Share, 
  Trash2, 
  Copy,
  Search,
  Filter,
  Calendar,
  Globe,
  Lock,
  BarChart3,
  Tag,
  FileText
} from 'lucide-react';
import { BulkActions } from './BulkActions';
import { ContentAnalytics } from './ContentAnalytics';
import { TagManager } from './TagManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { PDFExporter, ShareManager } from '@/lib/export';
import type { BrandRider, CV as CVDocument } from '@/lib/generators/types';

type BrandRow = Database['public']['Tables']['brands']['Row'] & {
  tags?: string[] | null;
  is_favorite?: boolean | null;
};

type CVRow = Database['public']['Tables']['cvs']['Row'] & {
  tags?: string[] | null;
  is_favorite?: boolean | null;
};

type UploadRow = Database['public']['Tables']['uploads']['Row'];

type ContentItem = BrandRow | CVRow | UploadRow;

const isUploadItem = (item: ContentItem): item is UploadRow => 'storage_path' in item;
const isBrandItem = (item: ContentItem): item is BrandRow => 'tagline' in item;
const isCVItem = (item: ContentItem): item is CVRow => 'summary' in item && !('storage_path' in item);

interface ContentGridProps {
  type: 'brands' | 'cvs' | 'uploads';
  items: ContentItem[];
  onRefresh: () => void;
}

export function ContentGrid({ type, items, onRefresh }: ContentGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('grid');
  const navigate = useNavigate();

  const filteredItems = items
    .filter(item => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (item.title?.toLowerCase().includes(query)) ||
        (item.original_name?.toLowerCase().includes(query)) ||
        (item.tagline?.toLowerCase().includes(query)) ||
        (item.summary?.toLowerCase().includes(query));

      const matchesFilter = 
        filterBy === 'all' || 
        item.visibility === filterBy ||
        item.format_preset === filterBy;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const aValue = a[sortBy] || a.created_at;
      const bValue = b[sortBy] || b.created_at;
      return new Date(bValue).getTime() - new Date(aValue).getTime();
    });

  const getFilterOptions = () => {
    const options = [{ value: 'all', label: 'All Items' }];

    if (type !== 'uploads') {
      const structuredItems = items.filter(item => !isUploadItem(item)) as Array<BrandRow | CVRow>;
      options.push(
        { value: 'public', label: 'Public' },
        { value: 'private', label: 'Private' }
      );

      // Add format presets
      const formats = [...new Set(structuredItems.map(item => item.format_preset).filter(Boolean))];
      formats.forEach(format => {
        options.push({ value: format, label: format.toUpperCase() });
      });
    }
    
    return options;
  };

  const tableName = useMemo(() => {
    switch (type) {
      case 'brands':
        return 'brands';
      case 'cvs':
        return 'cvs';
      default:
        return 'uploads';
    }
  }, [type]);

  const createHandledError = (error: unknown, fallbackMessage: string) => {
    const message =
      error instanceof Error && error.message
        ? error.message
        : fallbackMessage;

    console.error(fallbackMessage, error);
    toast.error(message);

    const handledError =
      error instanceof Error ? error : new Error(message || fallbackMessage);
    (handledError as any).handled = true;
    return handledError;
  };

  const triggerFileDownload = (url: string, filename: string) => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const getItemTags = (item: ContentItem): string[] => {
    if ('tags' in item && Array.isArray(item.tags)) {
      return (item.tags as string[]) ?? [];
    }
    return [];
  };

  const mapBrandToDocument = (brand: Database['public']['Tables']['brands']['Row']): BrandRider => ({
    title: brand.title || 'Untitled Brand',
    tagline: brand.tagline || '',
    voiceTone: brand.tone_notes ? [brand.tone_notes] : [],
    signaturePhrases: brand.signature_phrases || [],
    strengths: brand.strengths || [],
    weaknesses: brand.weaknesses || [],
    palette: (brand.color_palette as BrandRider['palette']) || [],
    fonts: (brand.fonts as BrandRider['fonts']) || { heading: 'Arial', body: 'Arial' },
    bio: brand.bio || '',
    examples: (brand.examples as BrandRider['examples']) || [],
    format: (brand.format_preset as BrandRider['format']) || 'professional',
  });

  const mapCVToDocument = (cv: Database['public']['Tables']['cvs']['Row']): CVDocument => ({
    name: cv.title || 'Untitled CV',
    role: 'Professional',
    summary: cv.summary || '',
    experience: (cv.experience as CVDocument['experience']) || [],
    skills: cv.skills || [],
    links: (cv.links as CVDocument['links']) || [],
    format: (cv.format_preset as CVDocument['format']) || 'professional',
  });

  const duplicateUpload = async (item: Database['public']['Tables']['uploads']['Row']) => {
    const originalPath = item.storage_path;
    const fileNameParts = item.original_name.split('.');
    const extension = fileNameParts.length > 1 ? `.${fileNameParts.pop()}` : '';
    const baseName = fileNameParts.join('.') || 'file';
    const newFileName = `${baseName}-copy${extension}`;
    const newPath = `${item.user_id}/${crypto.randomUUID?.() || Date.now()}-${newFileName}`;

    const { error: copyError } = await supabase.storage
      .from('uploads')
      .copy(originalPath, newPath);

    if (copyError) {
      throw copyError;
    }

    const { error: insertError } = await supabase
      .from('uploads')
      .insert({
        user_id: item.user_id,
        storage_path: newPath,
        original_name: newFileName,
        mime_type: item.mime_type,
        size_bytes: item.size_bytes,
        extracted_text: item.extracted_text,
        visibility: item.visibility,
      });

    if (insertError) {
      throw insertError;
    }
  };

  const duplicateRecord = async (itemId: string) => {
    if (type === 'uploads') {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error || !data) {
        throw error || new Error('Upload not found');
      }

      await duplicateUpload(data);
      return;
    }

    if (type === 'brands') {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error || !data) {
        throw error || new Error('Brand not found');
      }

      const now = new Date().toISOString();
      const { id, created_at, updated_at, ...rest } = data;
      const payload: Partial<BrandRow> = {
        ...rest,
        title: data.title ? `${data.title} (Copy)` : 'Untitled brand Copy',
        created_at: now,
        updated_at: now,
      };

      const { error: insertError } = await supabase
        .from('brands')
        .insert(payload as Database['public']['Tables']['brands']['Insert']);

      if (insertError) {
        throw insertError;
      }

      return;
    }

    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error || !data) {
      throw error || new Error('CV not found');
    }

    const now = new Date().toISOString();
    const { id, created_at, updated_at, ...rest } = data;
    const payload: Partial<CVRow> = {
      ...rest,
      title: data.title ? `${data.title} (Copy)` : 'Untitled cv Copy',
      created_at: now,
      updated_at: now,
    };

    const { error: insertError } = await supabase
      .from('cvs')
      .insert(payload as Database['public']['Tables']['cvs']['Insert']);

    if (insertError) {
      throw insertError;
    }
  };

  const deleteUpload = async (item: Database['public']['Tables']['uploads']['Row']) => {
    const { error: storageError } = await supabase.storage
      .from('uploads')
      .remove([item.storage_path]);

    if (storageError) {
      throw storageError;
    }
  };

  const deleteRecord = async (item: ContentItem) => {
    if (type === 'uploads') {
      await deleteUpload(item as UploadRow);
    }

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', item.id);

    if (error) {
      throw error;
    }
  };

  const shareItem = async (itemId: string) => {
    if (type === 'uploads') {
      throw new Error('Sharing is not supported for uploads');
    }

    const shareResult =
      type === 'brands'
        ? await ShareManager.shareBrandRider(itemId)
        : await ShareManager.shareCV(itemId);

    try {
      await navigator.clipboard.writeText(shareResult.url);
      toast.success('Share link copied to clipboard');
    } catch (clipboardError) {
      console.warn('Clipboard write failed, falling back to prompt', clipboardError);
      window.prompt?.('Share link (copy manually):', shareResult.url);
      toast.success('Share link ready');
    }
  };

  const downloadUpload = async (item: Database['public']['Tables']['uploads']['Row']) => {
    const { data, error } = await supabase.storage
      .from('uploads')
      .download(item.storage_path);

    if (error || !data) {
      throw error || new Error('Unable to download file');
    }

    const url = URL.createObjectURL(data);
    triggerFileDownload(url, item.original_name);
    URL.revokeObjectURL(url);
  };

  const downloadBrand = async (itemId: string) => {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error || !data) {
      throw error || new Error('Brand not found');
    }

    const document = mapBrandToDocument(data);
    const { url, filename } = await PDFExporter.exportBrandRider(document, {
      filename: `${(data.title || 'brand')}-rider.pdf`,
    });

    triggerFileDownload(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const downloadCV = async (itemId: string) => {
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error || !data) {
      throw error || new Error('CV not found');
    }

    const document = mapCVToDocument(data);
    const { url, filename } = await PDFExporter.exportCV(document, {
      filename: `${(data.title || 'cv')}.pdf`,
    });

    triggerFileDownload(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleAction = async (action: string, item: ContentItem) => {
    switch (action) {
      case 'view':
        if (type === 'brands') {
          navigate(`/brand/${item.id}`);
        } else if (type === 'cvs') {
          navigate(`/cv/${item.id}`);
        }
        break;
      case 'edit':
        if (type === 'brands') {
          navigate(`/brand/${item.id}/edit`);
        } else if (type === 'cvs') {
          navigate(`/cv/${item.id}/edit`);
        }
        break;
      case 'generateCV':
        if (type === 'brands') {
          console.log('Navigating to generate CV for brand:', item.id);
          // Navigate to a dedicated CV generation page with brand context
          navigate(`/brand/${item.id}/generate-cv`);
        }
        break;
      case 'duplicate':
        try {
          await duplicateRecord(item.id);
          toast.success(`${type.slice(0, -1)} duplicated successfully`);
          onRefresh();
        } catch (error) {
          throw createHandledError(error, `Unable to duplicate ${type.slice(0, -1)}`);
        }
        return;
      case 'delete':
        try {
          await deleteRecord(item);
          toast.success(`${type.slice(0, -1)} deleted successfully`);
          onRefresh();
        } catch (error) {
          throw createHandledError(error, `Unable to delete ${type.slice(0, -1)}`);
        }
        return;
      case 'share':
        try {
          await shareItem(item.id);
        } catch (error) {
          throw createHandledError(error, `Unable to share ${type.slice(0, -1)}`);
        }
        return;
      case 'download':
        try {
          if (type === 'uploads') {
            await downloadUpload(item);
          } else if (type === 'brands') {
            await downloadBrand(item.id);
          } else if (type === 'cvs') {
            await downloadCV(item.id);
          }
          toast.success('Download started');
        } catch (error) {
          throw createHandledError(error, `Unable to download ${type.slice(0, -1)}`);
        }
        return;
    }
  };

  const handleBulkAction = async (action: string, itemIds: string[]) => {
    const selectedItems = items.filter(item => itemIds.includes(item.id));

    if (selectedItems.length === 0) {
      return;
    }

    try {
      switch (action) {
        case 'duplicate':
          for (const item of selectedItems) {
            await duplicateRecord(item.id);
          }
          onRefresh();
          break;
        case 'export':
          for (const item of selectedItems) {
            await handleAction('download', item);
          }
          break;
        case 'share':
          if (type === 'uploads') {
            throw new Error('Uploads cannot be shared');
          }
          {
            const shareLinks: string[] = [];
            for (const item of selectedItems) {
              const result =
                type === 'brands'
                  ? await ShareManager.shareBrandRider(item.id)
                  : await ShareManager.shareCV(item.id);
              shareLinks.push(result.url);
            }
            const combinedLinks = shareLinks.join('\n');
            try {
              await navigator.clipboard.writeText(combinedLinks);
              toast.success('Share links copied to clipboard');
            } catch (clipboardError) {
              console.warn('Failed to write share links to clipboard', clipboardError);
              window.prompt?.('Share links (copy manually):', combinedLinks);
              toast.success('Share links ready');
            }
          }
          break;
        case 'archive':
          if (type === 'uploads') {
            throw new Error('Archive is only available for generated content');
          }
          await supabase
            .from(tableName)
            .update({ visibility: 'archived' } as any)
            .in('id', itemIds);
          onRefresh();
          break;
        case 'makePublic':
          if (type === 'uploads') {
            throw new Error('Visibility updates are not supported for uploads');
          }
          await supabase
            .from(tableName)
            .update({ visibility: 'public' } as any)
            .in('id', itemIds);
          onRefresh();
          break;
        case 'makePrivate':
          if (type === 'uploads') {
            throw new Error('Visibility updates are not supported for uploads');
          }
          await supabase
            .from(tableName)
            .update({ visibility: 'private' } as any)
            .in('id', itemIds);
          onRefresh();
          break;
        case 'addTag':
          if (type === 'uploads') {
            throw new Error('Tags are only supported for generated content');
          }
          {
            const newTag = window.prompt?.('Enter a tag to add to the selected items');
            if (!newTag) {
              throw new Error('Tag entry cancelled');
            }

            for (const item of selectedItems) {
              const updatedTags = Array.from(new Set([...getItemTags(item), newTag]));
              await supabase
                .from(tableName)
                .update({ tags: updatedTags } as any)
                .eq('id', item.id);
            }
            onRefresh();
          }
          break;
        case 'delete':
          for (const item of selectedItems) {
            await deleteRecord(item);
          }
          onRefresh();
          break;
        default:
          console.warn(`Unhandled bulk action: ${action}`);
      }
    } catch (error) {
      if ((error as any)?.handled) {
        throw error;
      }
      throw createHandledError(error, `Failed to process ${action} action`);
    }
  };

  const handleTagsUpdate = async (itemId: string, tags: string[]) => {
    if (type === 'uploads') {
      toast.error('Tags are only available for generated content');
      return;
    }

    try {
      const { error } = await supabase
        .from(tableName)
        .update({ tags } as any)
        .eq('id', itemId);

      if (error) {
        throw error;
      }

      toast.success('Tags updated successfully');
      onRefresh();
    } catch (error) {
      throw createHandledError(error, 'Failed to update tags');
    }
  };

  const handleFavoriteToggle = async (itemId: string, isFavorite: boolean) => {
    if (type === 'uploads') {
      toast.error('Favorites are only available for generated content');
      return;
    }

    try {
      const { error } = await supabase
        .from(tableName)
        .update({ is_favorite: isFavorite } as any)
        .eq('id', itemId);

      if (error) {
        throw error;
      }

      toast.success(isFavorite ? 'Added to favorites' : 'Removed from favorites');
      onRefresh();
    } catch (error) {
      throw createHandledError(error, 'Failed to update favorite status');
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(filteredItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleItemSelect = (itemId: string, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {type !== 'uploads' && <TabsTrigger value="tags">Tags</TabsTrigger>}
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={`Search ${type}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_at">Last Updated</SelectItem>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="title">Name</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-[120px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getFilterOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Single Item Actions or Bulk Actions */}
          {selectedItems.length === 1 ? (
            <SingleItemActions
              item={filteredItems.find(item => item.id === selectedItems[0]) ?? null}
              contentType={type}
              onAction={handleAction}
              onClearSelection={() => setSelectedItems([])}
            />
          ) : (
            <BulkActions
              selectedItems={selectedItems}
              totalItems={filteredItems.length}
              contentType={type}
              onSelectAll={handleSelectAll}
              onClearSelection={() => setSelectedItems([])}
              onBulkAction={handleBulkAction}
            />
          )}

          {/* Content Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchQuery || filterBy !== 'all' 
                  ? `No ${type} match your search criteria.`
                  : `You haven't created any ${type} yet.`
                }
              </div>
              {!searchQuery && filterBy === 'all' && (
                <Button onClick={() => navigate('/create')}>
                  Create Your First {type.slice(0, -1)}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <ContentCard
                  key={item.id}
                  type={type}
                  item={item}
                  isSelected={selectedItems.includes(item.id)}
                  onSelect={(selected) => handleItemSelect(item.id, selected)}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <ContentAnalytics contentType={type} items={items} />
        </TabsContent>

        {type !== 'uploads' && (
          <TabsContent value="tags">
            <TagManager
              contentType={type}
              items={items}
              onTagsUpdate={handleTagsUpdate}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </TabsContent>
        )}

        <TabsContent value="favorites">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Favorite {type}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.filter(item => Boolean(item.is_favorite)).map((item) => (
                <ContentCard
                  key={item.id}
                  type={type}
                  item={item}
                  isSelected={selectedItems.includes(item.id)}
                  onSelect={(selected) => handleItemSelect(item.id, selected)}
                  onAction={handleAction}
                />
              ))}
            </div>
            {items.filter(item => Boolean(item.is_favorite)).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No favorite {type} yet. Star items to add them to your favorites.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ContentCardProps {
  type: 'brands' | 'cvs' | 'uploads';
  item: ContentItem;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onAction: (action: string, item: ContentItem) => Promise<void> | void;
}

function ContentCard({ type, item, isSelected = false, onSelect, onAction }: ContentCardProps) {
  const getTitle = () => {
    if (isUploadItem(item)) return item.original_name;
    return item.title || `Untitled ${type.slice(0, -1)}`;
  };

  const getSubtitle = () => {
    if (isUploadItem(item)) {
      return `${item.mime_type} • ${formatFileSize(item.size_bytes)}`;
    }
    if (isBrandItem(item)) return item.tagline || '';
    if (isCVItem(item)) return item.summary || '';
    return '';
  };

  const getActions = () => {
    const commonActions = [
      { key: 'duplicate', label: 'Duplicate', icon: Copy, destructive: false },
      { key: 'delete', label: 'Delete', icon: Trash2, destructive: true },
    ];

    if (type === 'uploads') {
      return [
        { key: 'download', label: 'Download', icon: Download, destructive: false },
        ...commonActions,
      ];
    }

    return [
      { key: 'view', label: 'View', icon: Eye, destructive: false },
      { key: 'edit', label: 'Edit', icon: Edit, destructive: false },
      { key: 'share', label: 'Share', icon: Share, destructive: false },
      { key: 'download', label: 'Export PDF', icon: Download, destructive: false },
      ...commonActions,
    ];
  };

  return (
    <Card className={`group hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {onSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                className="mt-1"
              />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{getTitle()}</CardTitle>
              {getSubtitle() && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {getSubtitle()}
                </p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {getActions().map((action, index) => (
                <div key={action.key}>
                  {index === getActions().length - 2 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => onAction(action.key, item)}
                    className={action.destructive ? 'text-destructive' : ''}
                  >
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {'format_preset' in item && item.format_preset && (
              <Badge variant="secondary" className="text-xs">
                {item.format_preset.toUpperCase()}
              </Badge>
            )}
            {'visibility' in item && item.visibility && (
              <Badge variant="outline" className="text-xs">
                {item.visibility === 'public' ? (
                  <><Globe className="w-3 h-3 mr-1" />Public</>
                ) : (
                  <><Lock className="w-3 h-3 mr-1" />Private</>
                )}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDistanceToNow(new Date(item.updated_at || item.created_at), { 
              addSuffix: true 
            })}
          </div>
        </div>
        
        {type !== 'uploads' && (
          <div className="mt-3 space-y-2">
            {/* Primary Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  Promise.resolve(onAction('view', item)).catch(() => {});
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  Promise.resolve(onAction('edit', item)).catch(() => {});
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {type === 'brands' && (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    Promise.resolve(onAction('generateCV', item)).catch(() => {});
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  CV
                </Button>
              )}
            </div>
            
            {/* Quick Actions - shown on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  Promise.resolve(onAction('share', item)).catch(() => {});
                }}
              >
                <Share className="w-3 h-3 mr-1" />
                Share
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  Promise.resolve(onAction('duplicate', item)).catch(() => {});
                }}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  Promise.resolve(onAction('download', item)).catch(() => {});
                }}
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
        )}
        
        {type === 'uploads' && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                Promise.resolve(onAction('download', item)).catch(() => {});
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SingleItemActionsProps {
  item: ContentItem | null;
  contentType: 'brands' | 'cvs' | 'uploads';
  onAction: (action: string, item: ContentItem) => Promise<void> | void;
  onClearSelection: () => void;
}

function SingleItemActions({ item, contentType, onAction, onClearSelection }: SingleItemActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!item) return null;

  const getTitle = () => {
    if (isUploadItem(item)) return item.original_name;
    return item.title || `Untitled ${contentType.slice(0, -1)}`;
  };

  const getPrimaryActions = () => {
    console.log('getPrimaryActions called with contentType:', contentType);
    
    if (contentType === 'uploads') {
      return [
        { key: 'download', label: 'Download', icon: Download, variant: 'default' as const },
      ];
    }

    if (contentType === 'brands') {
      console.log('Returning brand actions including Generate CV');
      return [
        { key: 'view', label: 'View', icon: Eye, variant: 'default' as const },
        { key: 'edit', label: 'Edit', icon: Edit, variant: 'outline' as const },
        { key: 'generateCV', label: 'Generate CV', icon: FileText, variant: 'outline' as const },
      ];
    }

    return [
      { key: 'view', label: 'View', icon: Eye, variant: 'default' as const },
      { key: 'edit', label: 'Edit', icon: Edit, variant: 'outline' as const },
    ];
  };

  const getSecondaryActions = () => {
    const actions: Array<{ key: string; label: string; icon: any; destructive?: boolean }> = [
      { key: 'duplicate', label: 'Duplicate', icon: Copy },
    ];

    if (contentType !== 'uploads') {
      actions.push(
        { key: 'share', label: 'Share', icon: Share },
        { key: 'download', label: 'Export PDF', icon: Download }
      );
    }

    actions.push(
      { key: 'delete', label: 'Delete', icon: Trash2, destructive: true }
    );

    return actions;
  };

  const handleAction = async (action: string) => {
    console.log('SingleItemActions handleAction called with:', action, item);
    
    if (action === 'delete') {
      setShowDeleteDialog(true);
      return;
    }

    setIsProcessing(true);
    try {
      await onAction(action, item);
      
      if (['duplicate', 'share', 'download'].includes(action)) {
        // Don't clear selection for these actions
      } else {
        onClearSelection();
      }
    } catch (error) {
      if (!(error as any)?.handled) {
        toast.error(`Failed to ${action} ${contentType.slice(0, -1)}. Please try again.`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await onAction('delete', item);
      onClearSelection();
    } catch (error) {
      if (!(error as any)?.handled) {
        toast.error(`Failed to delete ${contentType.slice(0, -1)}. Please try again.`);
      }
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {contentType === 'brands' && <BarChart3 className="w-5 h-5 text-primary" />}
              {contentType === 'cvs' && <Eye className="w-5 h-5 text-primary" />}
              {contentType === 'uploads' && <Download className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h3 className="font-medium text-sm">{getTitle()}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {isBrandItem(item) && item.tagline}
                {isCVItem(item) && item.summary}
                {isUploadItem(item) && `${item.mime_type} • ${formatFileSize(item.size_bytes)}`}
              </p>
              {contentType === 'brands' && (
                <div className="flex items-center gap-2 mt-1">
                  {isBrandItem(item) && item.format_preset && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {item.format_preset.toUpperCase()}
                    </Badge>
                  )}
                  {'visibility' in item && item.visibility && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {item.visibility === 'public' ? 'Public' : 'Private'}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <Badge variant="secondary" className="text-xs">
            1 selected
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Primary Actions */}
          {getPrimaryActions().map((action) => (
            <Button
              key={action.key}
              variant={action.variant}
              size="sm"
              onClick={() => {
                console.log('Button clicked:', action.key);
                handleAction(action.key);
              }}
              disabled={isProcessing}
              className="gap-2"
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Button>
          ))}

          {/* Secondary Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessing}
                className="gap-2"
              >
                More
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {getSecondaryActions().map((action, index) => (
                <div key={action.key}>
                  {action.destructive && index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => handleAction(action.key)}
                    className={action.destructive ? 'text-destructive' : ''}
                    disabled={isProcessing}
                  >
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isProcessing}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {getTitle()}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {contentType.slice(0, -1)} and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}