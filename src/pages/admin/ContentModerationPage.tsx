import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModerationQueue } from '../../components/admin/moderation/ModerationQueue';
import { ModerationStats } from '../../components/admin/moderation/ModerationStats';
import { ModerationFilters } from '../../components/admin/moderation/ModerationFilters';
import { AutoFlaggingStats } from '../../components/admin/moderation/AutoFlaggingStats';
import { ManualContentAnalysis } from '../../components/admin/moderation/ManualContentAnalysis';
import { useContentModeration } from '@/hooks/use-content-moderation';
import { useAdmin } from '@/contexts/AdminContext';
import { ContentModerationFilters } from '@/lib/admin/api/content-moderation-api';
import { ModerationStatus, ContentType } from '@/lib/admin/moderation-service';

export function ContentModerationPage() {
  const { user } = useAdmin();
  const [filters, setFilters] = useState<ContentModerationFilters>({});
  const [activeTab, setActiveTab] = useState<ModerationStatus | 'all' | 'auto-flagging' | 'analysis'>('pending');

  const moderation = useContentModeration(
    {
      filters: {
        ...filters,
        status: activeTab === 'all' ? undefined : activeTab
      },
      pagination: { limit: 25 },
      autoRefresh: true,
      refreshInterval: 30000 // 30 seconds
    },
    user?.id
  );

  const handleFilterChange = (newFilters: ContentModerationFilters) => {
    setFilters(newFilters);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as ModerationStatus | 'all' | 'auto-flagging' | 'analysis');
  };

  return (
    <AdminLayout>
      <PermissionGate requiredPermissions={['moderate_content']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
            <p className="text-muted-foreground">
              Review and moderate user-generated content
            </p>
          </div>

          {/* Statistics */}
          <ModerationStats 
            stats={moderation.stats}
            loading={moderation.statsLoading}
            onRefresh={moderation.refreshStats}
          />

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <ModerationFilters
                filters={filters}
                flagReasons={moderation.flagReasons}
                onFiltersChange={handleFilterChange}
              />
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <div className="px-6 pt-6">
                  <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    <TabsTrigger value="escalated">Escalated</TabsTrigger>
                    <TabsTrigger value="auto-flagging">Auto-Flagging</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  </TabsList>
                </div>

                {/* Moderation Queue Tabs */}
                {['all', 'pending', 'approved', 'rejected', 'escalated'].includes(activeTab) && (
                  <TabsContent value={activeTab} className="mt-0">
                    <div className="px-6 pb-2">
                      <h3 className="text-lg font-semibold">Moderation Queue</h3>
                      <p className="text-sm text-muted-foreground">
                        Review and moderate user-generated content
                      </p>
                    </div>
                    <ModerationQueue
                      items={moderation.queue.items}
                      loading={moderation.queue.loading}
                      error={moderation.queue.error}
                      hasMore={moderation.queue.hasMore}
                      onLoadMore={moderation.queue.loadMore}
                      onRefresh={moderation.queue.refresh}
                      onModerate={moderation.moderateContent}
                      onBulkModerate={moderation.bulkModerate}
                      onEscalate={moderation.escalateContent}
                      onGetPreview={moderation.getContentPreview}
                      flagReasons={moderation.flagReasons}
                    />
                  </TabsContent>
                )}

                {/* Auto-Flagging Stats Tab */}
                <TabsContent value="auto-flagging" className="mt-0">
                  <div className="p-6">
                    <AutoFlaggingStats />
                  </div>
                </TabsContent>

                {/* Manual Analysis Tab */}
                <TabsContent value="analysis" className="mt-0">
                  <div className="p-6">
                    <ManualContentAnalysis />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </PermissionGate>
    </AdminLayout>
  );
}