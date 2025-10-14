import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  IdCard, 
  Upload, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useDashboardData, useSearchableContent } from '@/hooks/use-dashboard-data';
import { formatDistanceToNow } from 'date-fns';

interface DashboardOverviewProps {
  userId: string;
}

export function DashboardOverview({ userId }: DashboardOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const { stats, isLoading } = useDashboardData(userId);
  const { data: searchResults } = useSearchableContent(userId, searchQuery);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Brand Riders"
          value={stats?.totalBrands || 0}
          icon={<FileText className="w-5 h-5" />}
          description="Professional brand documents"
          onClick={() => navigate('/dashboard?tab=brands')}
        />
        <StatsCard
          title="CVs"
          value={stats?.totalCVs || 0}
          icon={<IdCard className="w-5 h-5" />}
          description="Generated resumes"
          onClick={() => navigate('/dashboard?tab=cvs')}
        />
        <StatsCard
          title="Uploads"
          value={stats?.totalUploads || 0}
          icon={<Upload className="w-5 h-5" />}
          description="Source documents"
          onClick={() => navigate('/dashboard?tab=uploads')}
        />
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Your Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search brands, CVs, and uploads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => navigate('/create')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New
            </Button>
          </div>
          
          {searchQuery && searchResults && (
            <div className="mt-4 space-y-4">
              <SearchResults
                brands={searchResults.brands}
                cvs={searchResults.cvs}
                uploads={searchResults.uploads}
                onNavigate={navigate}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={activity.id}>
                  <ActivityItem
                    activity={activity}
                    onNavigate={navigate}
                  />
                  {index < stats.recentActivity.length - 1 && (
                    <Separator className="mt-3" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionButton
              icon={<Plus className="w-5 h-5" />}
              title="Create Brand"
              description="Start new brand rider"
              onClick={() => navigate('/create')}
            />
            <QuickActionButton
              icon={<FileText className="w-5 h-5" />}
              title="View Brands"
              description="Manage your brands"
              onClick={() => navigate('/dashboard?tab=brands')}
            />
            <QuickActionButton
              icon={<IdCard className="w-5 h-5" />}
              title="View CVs"
              description="Manage your CVs"
              onClick={() => navigate('/dashboard?tab=cvs')}
            />
            <QuickActionButton
              icon={<TrendingUp className="w-5 h-5" />}
              title="Gallery"
              description="Browse community"
              onClick={() => navigate('/gallery')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  onClick: () => void;
}

function StatsCard({ title, value, icon, description, onClick }: StatsCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface SearchResultsProps {
  brands: any[];
  cvs: any[];
  uploads: any[];
  onNavigate: (path: string) => void;
}

function SearchResults({ brands, cvs, uploads, onNavigate }: SearchResultsProps) {
  const hasResults = brands.length > 0 || cvs.length > 0 || uploads.length > 0;

  if (!hasResults) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No results found for your search.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {brands.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Brand Riders ({brands.length})
          </h4>
          <div className="space-y-2">
            {brands.slice(0, 3).map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => onNavigate(`/brand/${brand.id}`)}
              >
                <div>
                  <div className="font-medium">{brand.title || 'Untitled Brand'}</div>
                  <div className="text-sm text-muted-foreground">{brand.tagline}</div>
                </div>
                <div className="flex items-center gap-2">
                  {brand.format_preset && (
                    <Badge variant="secondary">{brand.format_preset}</Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cvs.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <IdCard className="w-4 h-4" />
            CVs ({cvs.length})
          </h4>
          <div className="space-y-2">
            {cvs.slice(0, 3).map((cv) => (
              <div
                key={cv.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => onNavigate(`/cv/${cv.id}`)}
              >
                <div>
                  <div className="font-medium">{cv.title || 'Untitled CV'}</div>
                  <div className="text-sm text-muted-foreground">{cv.summary}</div>
                </div>
                <div className="flex items-center gap-2">
                  {cv.format_preset && (
                    <Badge variant="secondary">{cv.format_preset}</Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploads.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Uploads ({uploads.length})
          </h4>
          <div className="space-y-2">
            {uploads.slice(0, 3).map((upload) => (
              <div
                key={upload.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{upload.original_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {upload.mime_type} • {formatFileSize(upload.size_bytes)}
                  </div>
                </div>
                <Badge variant="outline">
                  {formatDistanceToNow(new Date(upload.created_at), { addSuffix: true })}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ActivityItemProps {
  activity: {
    id: string;
    type: 'brand' | 'cv' | 'upload';
    title: string;
    action: 'created' | 'updated';
    timestamp: string;
  };
  onNavigate: (path: string) => void;
}

function ActivityItem({ activity, onNavigate }: ActivityItemProps) {
  const getIcon = () => {
    switch (activity.type) {
      case 'brand':
        return <FileText className="w-4 h-4" />;
      case 'cv':
        return <IdCard className="w-4 h-4" />;
      case 'upload':
        return <Upload className="w-4 h-4" />;
    }
  };

  const getPath = () => {
    switch (activity.type) {
      case 'brand':
        return `/brand/${activity.id}`;
      case 'cv':
        return `/cv/${activity.id}`;
      case 'upload':
        return '/dashboard?tab=uploads';
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muted rounded-lg">
          {getIcon()}
        </div>
        <div>
          <div className="font-medium">{activity.title}</div>
          <div className="text-sm text-muted-foreground">
            {activity.action === 'created' ? 'Created' : 'Updated'} {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="capitalize">
          {activity.type}
        </Badge>
        {activity.type !== 'upload' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(getPath())}
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function QuickActionButton({ icon, title, description, onClick }: QuickActionButtonProps) {
  return (
    <Button
      variant="outline"
      className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-muted/50"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 w-full">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      <span className="text-xs text-muted-foreground text-left">{description}</span>
    </Button>
  );
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}