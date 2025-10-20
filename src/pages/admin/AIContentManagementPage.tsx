import React, { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContentReviewInterface } from '@/components/admin/moderation/ContentReviewInterface'
import { AIUsageAnalytics } from '@/components/admin/analytics/AIUsageAnalytics'
import { AIPerformanceDashboard } from '@/components/admin/analytics/AIPerformanceDashboard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Settings, AlertTriangle, BarChart3, Zap } from 'lucide-react'
import { cdnCacheService } from '@/lib/ai/cdn-cache-service'
import { backgroundProcessor } from '@/lib/ai/background-processor'

export const AIContentManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [cacheStats, setCacheStats] = useState<any>(null)

  const handleOptimizeCache = async () => {
    try {
      setLoading(true)
      await cdnCacheService.optimizeCache()
      const stats = await cdnCacheService.getCacheStats()
      setCacheStats(stats)
    } catch (error) {
      console.error('Failed to optimize cache:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCleanupExpired = async () => {
    try {
      setLoading(true)
      const cleaned = await cdnCacheService.cleanupExpiredEntries()
      console.log(`Cleaned up ${cleaned} expired entries`)
      const stats = await cdnCacheService.getCacheStats()
      setCacheStats(stats)
    } catch (error) {
      console.error('Failed to cleanup expired entries:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    const loadCacheStats = async () => {
      const stats = await cdnCacheService.getCacheStats()
      setCacheStats(stats)
    }
    loadCacheStats()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">AI Content Management</h1>
            <p className="text-gray-600 mt-2">
              Monitor AI content generation, moderation, and system performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCleanupExpired}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Cleanup Cache
            </Button>
            <Button
              variant="outline"
              onClick={handleOptimizeCache}
              disabled={loading}
            >
              <Settings className="h-4 w-4 mr-2" />
              Optimize Cache
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {cacheStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Entries</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cacheStats.totalEntries.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(cacheStats.totalSize / (1024 * 1024)).toFixed(1)}MB
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Badge 
                    variant={cacheStats.hitRate > 0.8 ? "default" : cacheStats.hitRate > 0.6 ? "secondary" : "destructive"}
                  >
                    {(cacheStats.hitRate * 100).toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Assets</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cacheStats.topAssets.length}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="moderation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="moderation">Content Moderation</TabsTrigger>
            <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="jobs">Background Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="moderation" className="space-y-6">
            <ContentReviewInterface />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AIUsageAnalytics />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <AIPerformanceDashboard />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <BackgroundJobsMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

const BackgroundJobsMonitor: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    const loadJobs = async () => {
      try {
        // Get recent background jobs
        const { data, error } = await supabase
          .from('ai_background_jobs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setJobs(data || [])
      } catch (error) {
        console.error('Failed to load background jobs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
    const interval = setInterval(loadJobs, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="p-6">Loading background jobs...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Background Jobs Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="flex justify-between items-center p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                  <span className="font-medium">{job.type}</span>
                  <span className="text-sm text-gray-500">Priority: {job.priority}</span>
                </div>
                <p className="text-sm text-gray-600">
                  Created: {new Date(job.created_at).toLocaleString()}
                </p>
                {job.error && (
                  <p className="text-sm text-red-600">Error: {job.error}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">User: {job.user_id.slice(0, 8)}...</p>
                {job.completed_at && (
                  <p className="text-sm text-gray-500">
                    Completed: {new Date(job.completed_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {jobs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No background jobs found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Import supabase for the BackgroundJobsMonitor component
import { supabase } from '@/integrations/supabase/client'