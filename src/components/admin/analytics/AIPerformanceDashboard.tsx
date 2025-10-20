import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Clock, CheckCircle, XCircle, Zap, DollarSign, Server } from 'lucide-react'
import { useAIPerformance } from '@/hooks/use-ai-performance'
import { cdnCacheService } from '@/lib/ai/cdn-cache-service'

export const AIPerformanceDashboard: React.FC = () => {
  const { stats, loading, loadMetrics, calculateStats, getProviderPerformance } = useAIPerformance()
  const [timeRange, setTimeRange] = useState('24h')
  const [providerStats, setProviderStats] = useState<any[]>([])
  const [cacheStats, setCacheStats] = useState<any>({
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    topAssets: []
  })

  useEffect(() => {
    loadData()
  }, [timeRange])

  const loadData = async () => {
    await Promise.all([
      loadMetrics(timeRange),
      calculateStats(timeRange),
      loadProviderStats(),
      loadCacheStats()
    ])
  }

  const loadProviderStats = async () => {
    const stats = await getProviderPerformance(timeRange)
    setProviderStats(stats)
  }

  const loadCacheStats = async () => {
    const stats = await cdnCacheService.getCacheStats()
    setCacheStats(stats)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600'
    if (value >= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return <div className="p-6">Loading performance data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Performance Dashboard</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">1 Hour</SelectItem>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(stats.avgResponseTime, { good: 2000, warning: 5000 })}`}>
              {Math.round(stats.avgResponseTime)}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(stats.successRate, { good: 95, warning: 90 })}`}>
              {stats.successRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.errorRate > 10 ? 'text-red-600' : stats.errorRate > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
              {stats.errorRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.throughput.toFixed(1)}/hr</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Request</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.costPerRequest / 100).toFixed(3)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Provider Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={providerStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provider" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgResponseTime" fill="#8884d8" name="Avg Response Time (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cache Performance */}
        <Card>
          <CardHeader>
            <CardTitle>CDN Cache Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold">{cacheStats.totalEntries.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Size</p>
                <p className="text-2xl font-bold">{formatBytes(cacheStats.totalSize)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hit Rate</p>
                <p className={`text-2xl font-bold ${getStatusColor(cacheStats.hitRate * 100, { good: 80, warning: 60 })}`}>
                  {(cacheStats.hitRate * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Top Assets</p>
                <p className="text-2xl font-bold">{cacheStats.topAssets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Provider</th>
                  <th className="text-left p-2">Requests</th>
                  <th className="text-left p-2">Avg Response Time</th>
                  <th className="text-left p-2">Success Rate</th>
                  <th className="text-left p-2">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {providerStats.map((provider) => (
                  <tr key={provider.provider} className="border-b">
                    <td className="p-2 font-medium">{provider.provider}</td>
                    <td className="p-2">{provider.requestCount.toLocaleString()}</td>
                    <td className="p-2">
                      <span className={getStatusColor(provider.avgResponseTime, { good: 2000, warning: 5000 })}>
                        {Math.round(provider.avgResponseTime)}ms
                      </span>
                    </td>
                    <td className="p-2">
                      <Badge 
                        variant={provider.successRate > 95 ? "default" : provider.successRate > 90 ? "secondary" : "destructive"}
                      >
                        {provider.successRate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-2">${(provider.totalCost / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Cached Assets */}
      <Card>
        <CardHeader>
          <CardTitle>Top Cached Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cacheStats.topAssets.slice(0, 10).map((asset: any, index: number) => (
              <div key={asset.key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <span className="font-mono text-sm">{asset.key}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{asset.hits} hits</span>
                  <span>{formatBytes(asset.size)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}