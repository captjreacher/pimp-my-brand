import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface PerformanceMetric {
  id: string
  metricType: string
  metricName: string
  value: number
  unit?: string
  tags?: Record<string, any>
  timestamp: string
}

export interface PerformanceStats {
  avgResponseTime: number
  successRate: number
  errorRate: number
  throughput: number
  costPerRequest: number
}

export const useAIPerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [stats, setStats] = useState<PerformanceStats>({
    avgResponseTime: 0,
    successRate: 0,
    errorRate: 0,
    throughput: 0,
    costPerRequest: 0
  })
  const [loading, setLoading] = useState(false)

  const recordMetric = useCallback(async (
    type: string,
    name: string,
    value: number,
    unit?: string,
    tags?: Record<string, any>
  ) => {
    try {
      await supabase
        .from('ai_performance_metrics')
        .insert({
          metric_type: type,
          metric_name: name,
          value,
          unit,
          tags: tags || {}
        })
    } catch (error) {
      console.error('Failed to record performance metric:', error)
    }
  }, [])

  const recordRequestMetrics = useCallback(async (
    feature: string,
    responseTime: number,
    success: boolean,
    cost?: number,
    provider?: string
  ) => {
    const tags = { feature, provider: provider || 'unknown' }
    
    await Promise.all([
      recordMetric('request', 'response_time', responseTime, 'ms', tags),
      recordMetric('request', 'success', success ? 1 : 0, 'boolean', tags),
      cost && recordMetric('request', 'cost', cost, 'cents', tags)
    ].filter(Boolean))
  }, [recordMetric])

  const loadMetrics = useCallback(async (
    timeRange: string = '24h',
    metricType?: string
  ) => {
    try {
      setLoading(true)
      
      const hoursBack = timeRange === '1h' ? 1 : 
                       timeRange === '24h' ? 24 : 
                       timeRange === '7d' ? 168 : 24
      
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
      
      let query = supabase
        .from('ai_performance_metrics')
        .select('*')
        .gte('timestamp', since)
        .order('timestamp', { ascending: false })
      
      if (metricType) {
        query = query.eq('metric_type', metricType)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setMetrics(data?.map(m => ({
        id: m.id,
        metricType: m.metric_type,
        metricName: m.metric_name,
        value: m.value,
        unit: m.unit,
        tags: m.tags,
        timestamp: m.timestamp
      })) || [])
      
    } catch (error) {
      console.error('Failed to load performance metrics:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateStats = useCallback(async (timeRange: string = '24h') => {
    try {
      const hoursBack = timeRange === '1h' ? 1 : 
                       timeRange === '24h' ? 24 : 
                       timeRange === '7d' ? 168 : 24
      
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
      
      // Get request metrics
      const { data: requestMetrics, error } = await supabase
        .from('ai_performance_metrics')
        .select('metric_name, value, tags')
        .eq('metric_type', 'request')
        .gte('timestamp', since)
      
      if (error) throw error
      
      const responseTimeMetrics = requestMetrics?.filter(m => m.metric_name === 'response_time') || []
      const successMetrics = requestMetrics?.filter(m => m.metric_name === 'success') || []
      const costMetrics = requestMetrics?.filter(m => m.metric_name === 'cost') || []
      
      const avgResponseTime = responseTimeMetrics.length > 0 
        ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
        : 0
      
      const successRate = successMetrics.length > 0
        ? (successMetrics.filter(m => m.value === 1).length / successMetrics.length) * 100
        : 0
      
      const errorRate = 100 - successRate
      
      const throughput = successMetrics.length / hoursBack // requests per hour
      
      const totalCost = costMetrics.reduce((sum, m) => sum + m.value, 0)
      const costPerRequest = successMetrics.length > 0 ? totalCost / successMetrics.length : 0
      
      setStats({
        avgResponseTime,
        successRate,
        errorRate,
        throughput,
        costPerRequest
      })
      
    } catch (error) {
      console.error('Failed to calculate performance stats:', error)
    }
  }, [])

  const getFeaturePerformance = useCallback(async (
    feature: string,
    timeRange: string = '24h'
  ) => {
    try {
      const hoursBack = timeRange === '1h' ? 1 : 
                       timeRange === '24h' ? 24 : 
                       timeRange === '7d' ? 168 : 24
      
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
      
      const { data, error } = await supabase
        .from('ai_performance_metrics')
        .select('*')
        .eq('metric_type', 'request')
        .gte('timestamp', since)
        .contains('tags', { feature })
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('Failed to get feature performance:', error)
      return []
    }
  }, [])

  const getProviderPerformance = useCallback(async (timeRange: string = '24h') => {
    try {
      const hoursBack = timeRange === '1h' ? 1 : 
                       timeRange === '24h' ? 24 : 
                       timeRange === '7d' ? 168 : 24
      
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
      
      const { data, error } = await supabase
        .from('ai_performance_metrics')
        .select('value, tags, metric_name')
        .eq('metric_type', 'request')
        .gte('timestamp', since)
      
      if (error) throw error
      
      // Group by provider
      const providerStats = (data || []).reduce((acc, metric) => {
        const provider = metric.tags?.provider || 'unknown'
        if (!acc[provider]) {
          acc[provider] = {
            responseTime: [],
            success: [],
            cost: []
          }
        }
        
        if (metric.metric_name === 'response_time') {
          acc[provider].responseTime.push(metric.value)
        } else if (metric.metric_name === 'success') {
          acc[provider].success.push(metric.value)
        } else if (metric.metric_name === 'cost') {
          acc[provider].cost.push(metric.value)
        }
        
        return acc
      }, {} as Record<string, any>)
      
      // Calculate averages
      return Object.entries(providerStats).map(([provider, stats]: [string, any]) => ({
        provider,
        avgResponseTime: stats.responseTime.length > 0 
          ? stats.responseTime.reduce((a: number, b: number) => a + b, 0) / stats.responseTime.length 
          : 0,
        successRate: stats.success.length > 0 
          ? (stats.success.filter((s: number) => s === 1).length / stats.success.length) * 100 
          : 0,
        totalCost: stats.cost.reduce((a: number, b: number) => a + b, 0),
        requestCount: stats.success.length
      }))
      
    } catch (error) {
      console.error('Failed to get provider performance:', error)
      return []
    }
  }, [])

  const recordCacheMetrics = useCallback(async (
    operation: 'hit' | 'miss' | 'set' | 'evict',
    cacheKey: string,
    size?: number
  ) => {
    const tags = { operation, cache_key: cacheKey }
    await recordMetric('cache', operation, 1, 'count', tags)
    
    if (size) {
      await recordMetric('cache', 'size', size, 'bytes', tags)
    }
  }, [recordMetric])

  useEffect(() => {
    loadMetrics()
    calculateStats()
  }, [loadMetrics, calculateStats])

  return {
    metrics,
    stats,
    loading,
    recordMetric,
    recordRequestMetrics,
    recordCacheMetrics,
    loadMetrics,
    calculateStats,
    getFeaturePerformance,
    getProviderPerformance
  }
}