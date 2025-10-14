import { useState } from 'react';
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
  Tag
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ContentGridProps {
  type: 'brands' | 'cvs' | 'uploads';
  items: any[];
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
      options.push(
        { value: 'public', label: 'Public' },
        { value: 'private', label: 'Private' }
      );
      
      // Add format presets
      const formats = [...new Set(items.map(item => item.format_preset).filter(Boolean))];
      formats.forEach(format => {
        options.push({ value: format, label: format.toUpperCase() });
      });
    }
    
    return options;
  };

  const handleAction = async (action: string, item: any) => {
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
      case 'duplicate':
        // TODO: Implement duplication logic
        toast.success(`${type.slice(0, -1)} duplicated successfully`);
        onRefresh();
        break;
      case 'delete':
        // TODO: Implement deletion logic with confirmation
        toast.success(`${type.slice(0, -1)} deleted successfully`);
        onRefresh();
        break;
      case 'share':
        // TODO: Implement sharing logic
        toast.success('Share link copied to clipboard');
        break;
      case 'download':
        // TODO: Implement download logic
        toast.success('Download started');
        break;
    }
  };

  const handleBulkAction = async (action: string, itemIds: string[]) => {
    // TODO: Implement bulk actions
    console.log(`Bulk ${action} for items:`, itemIds);
  };

  const handleTagsUpdate = async (itemId: string, tags: string[]) => {
    // TODO: Implement tags update
    console.log(`Update tags for ${itemId}:`, tags);
  };

  const handleFavoriteToggle = async (itemId: string, isFavorite: boolean) => {
    // TODO: Implement favorite toggle
    console.log(`Toggle favorite for ${itemId}:`, isFavorite);
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

          {/* Bulk Actions */}
          <BulkActions
            selectedItems={selectedItems}
            totalItems={filteredItems.length}
            contentType={type}
            onSelectAll={handleSelectAll}
            onClearSelection={() => setSelectedItems([])}
            onBulkAction={handleBulkAction}
          />

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
              {items.filter(item => item.is_favorite).map((item) => (
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
            {items.filter(item => item.is_favorite).length === 0 && (
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
  item: any;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onAction: (action: string, item: any) => void;
}

function ContentCard({ type, item, isSelected = false, onSelect, onAction }: ContentCardProps) {
  const getTitle = () => {
    if (type === 'uploads') return item.original_name;
    return item.title || `Untitled ${type.slice(0, -1)}`;
  };

  const getSubtitle = () => {
    if (type === 'uploads') {
      return `${item.mime_type} • ${formatFileSize(item.size_bytes)}`;
    }
    if (type === 'brands') return item.tagline;
    if (type === 'cvs') return item.summary;
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
            {item.format_preset && (
              <Badge variant="secondary" className="text-xs">
                {item.format_preset.toUpperCase()}
              </Badge>
            )}
            {item.visibility && (
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
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onAction('view', item)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onAction('edit', item)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}