import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tag, 
  Plus, 
  X, 
  Hash,
  Star,
  StarOff,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type BrandRow = Database['public']['Tables']['brands']['Row'] & {
  tags?: string[] | null;
  is_favorite?: boolean | null;
};

type CVRow = Database['public']['Tables']['cvs']['Row'] & {
  tags?: string[] | null;
  is_favorite?: boolean | null;
};

type TaggableItem = BrandRow | CVRow;

interface TagManagerProps {
  contentType: 'brands' | 'cvs';
  items: TaggableItem[];
  onTagsUpdate: (itemId: string, tags: string[]) => Promise<void>;
  onFavoriteToggle: (itemId: string, isFavorite: boolean) => Promise<void>;
}

interface TagStats {
  tag: string;
  count: number;
  color: string;
}

export function TagManager({ contentType, items, onTagsUpdate, onFavoriteToggle }: TagManagerProps) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagStats, setTagStats] = useState<TagStats[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    calculateTagStats();
  }, [items]);

  const calculateTagStats = () => {
    const tagCounts: Record<string, number> = {};
    const uniqueTags = new Set<string>();

    items.forEach(item => {
      const tags = item.tags ?? [];
      tags.forEach((tag: string) => {
        uniqueTags.add(tag);
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    setAllTags(Array.from(uniqueTags));
    
    const stats = Array.from(uniqueTags).map(tag => ({
      tag,
      count: tagCounts[tag],
      color: getTagColor(tag),
    })).sort((a, b) => b.count - a.count);

    setTagStats(stats);
  };

  const getTagColor = (tag: string): string => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    ];
    
    const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const filteredItems = items.filter(item => {
    const matchesTag = selectedTag === 'all' || (item.tags || []).includes(selectedTag);
    const matchesFavorite = !showFavoritesOnly || item.is_favorite;
    return matchesTag && matchesFavorite;
  });

  const favoriteItems = items.filter(item => Boolean(item.is_favorite));

  return (
    <div className="space-y-6">
      {/* Tag Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Tags & Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Favorites Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">Favorites</span>
                <Badge variant="secondary">{favoriteItems.length}</Badge>
              </div>
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="gap-2"
              >
                {showFavoritesOnly ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                {showFavoritesOnly ? 'Show All' : 'Favorites Only'}
              </Button>
            </div>

            {/* Tag Filter */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filter by tag:</span>
              </div>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {tagStats.map(stat => (
                    <SelectItem key={stat.tag} value={stat.tag}>
                      {stat.tag} ({stat.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Popular Tags */}
            {tagStats.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Popular Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {tagStats.slice(0, 10).map(stat => (
                    <Badge
                      key={stat.tag}
                      variant="secondary"
                      className={`cursor-pointer ${stat.color}`}
                      onClick={() => setSelectedTag(stat.tag)}
                    >
                      {stat.tag} ({stat.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filtered Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {selectedTag === 'all' ? 'All Items' : `Tagged: ${selectedTag}`}
            {showFavoritesOnly && ' (Favorites)'}
          </h3>
          <span className="text-sm text-muted-foreground">
            {filteredItems.length} {contentType}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <TaggedItemCard
              key={item.id}
              item={item}
              contentType={contentType}
              allTags={allTags}
              onTagsUpdate={onTagsUpdate}
              onFavoriteToggle={onFavoriteToggle}
              getTagColor={getTagColor}
            />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No {contentType} found with the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}

interface TaggedItemCardProps {
  item: TaggableItem;
  contentType: 'brands' | 'cvs';
  allTags: string[];
  onTagsUpdate: (itemId: string, tags: string[]) => Promise<void>;
  onFavoriteToggle: (itemId: string, isFavorite: boolean) => Promise<void>;
  getTagColor: (tag: string) => string;
}

function TaggedItemCard({ 
  item, 
  contentType, 
  allTags, 
  onTagsUpdate, 
  onFavoriteToggle,
  getTagColor 
}: TaggedItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [itemTags, setItemTags] = useState<string[]>(item.tags ?? []);

  const handleAddTag = async () => {
    if (!newTag.trim() || itemTags.includes(newTag.trim())) return;

    const updatedTags = [...itemTags, newTag.trim()];
    setItemTags(updatedTags);
    setNewTag('');

    try {
      await onTagsUpdate(item.id, updatedTags);
    } catch (error) {
      setItemTags(itemTags);
      if (!(error as any)?.handled) {
        toast.error('Failed to add tag');
      }
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = itemTags.filter(tag => tag !== tagToRemove);
    setItemTags(updatedTags);

    try {
      await onTagsUpdate(item.id, updatedTags);
    } catch (error) {
      setItemTags(itemTags);
      if (!(error as any)?.handled) {
        toast.error('Failed to remove tag');
      }
    }
  };

  const handleFavoriteToggle = async () => {
    try {
      await onFavoriteToggle(item.id, !Boolean(item.is_favorite));
    } catch (error) {
      if (!(error as any)?.handled) {
        toast.error('Failed to update favorite status');
      }
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">
              {item.title || `Untitled ${contentType.slice(0, -1)}`}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {'tagline' in item ? item.tagline : item.summary}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFavoriteToggle}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {item.is_favorite ? (
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            ) : (
              <StarOff className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Existing Tags */}
          {itemTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {itemTags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className={`text-xs ${getTagColor(tag)} group/tag`}
                >
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add Tag */}
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Tags</DialogTitle>
                <DialogDescription>
                  Add tags to organize your {contentType.slice(0, -1)}.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter tag name..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button onClick={handleAddTag} disabled={!newTag.trim()}>
                    Add
                  </Button>
                </div>

                {allTags.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Or select from existing tags:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {allTags
                        .filter(tag => !itemTags.includes(tag))
                        .slice(0, 10)
                        .map(tag => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => {
                              setNewTag(tag);
                              handleAddTag();
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}