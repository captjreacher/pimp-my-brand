import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, IdCard, Upload, BarChart3 } from 'lucide-react';
import { DashboardOverview } from './DashboardOverview';
import { ContentGrid } from './ContentGrid';
import { useDashboardData } from '@/hooks/use-dashboard-data';

interface DashboardTabsProps {
  userId: string;
}

export function DashboardTabs({ userId }: DashboardTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  
  const { brands, cvs, uploads, refetch } = useDashboardData(userId);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'brands', 'cvs', 'uploads'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams);
    if (value === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger value="brands" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Brands</span>
          {brands.length > 0 && (
            <span className="ml-1 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
              {brands.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="cvs" className="flex items-center gap-2">
          <IdCard className="w-4 h-4" />
          <span className="hidden sm:inline">CVs</span>
          {cvs.length > 0 && (
            <span className="ml-1 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
              {cvs.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="uploads" className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Uploads</span>
          {uploads.length > 0 && (
            <span className="ml-1 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
              {uploads.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <DashboardOverview userId={userId} />
      </TabsContent>

      <TabsContent value="brands" className="mt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Brand Riders</h2>
              <p className="text-muted-foreground">
                Manage your professional brand documents
              </p>
            </div>
          </div>
          <ContentGrid
            type="brands"
            items={brands}
            onRefresh={refetch}
          />
        </div>
      </TabsContent>

      <TabsContent value="cvs" className="mt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">CVs</h2>
              <p className="text-muted-foreground">
                Manage your generated resumes and CVs
              </p>
            </div>
          </div>
          <ContentGrid
            type="cvs"
            items={cvs}
            onRefresh={refetch}
          />
        </div>
      </TabsContent>

      <TabsContent value="uploads" className="mt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Uploads</h2>
              <p className="text-muted-foreground">
                Manage your uploaded source documents
              </p>
            </div>
          </div>
          <ContentGrid
            type="uploads"
            items={uploads}
            onRefresh={refetch}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}