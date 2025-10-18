import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { DollarSign, Users, Zap, TrendingUp, AlertCircle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface UsageMetrics {
  totalRequests: number
  totalCost: number
  activeUsers: number
  successRate: number
  avgResponseTime: number
}

interface FeatureUsage {
  feature: string
  requests: number
  cost: number
  successRate: number
}

interface CostTrend {
  date: string
  cost: number
  requests: number
}

interface UserEngagement {
  tier: string
  users: number
  avgUsage: number
}

export const AIUsageAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<UsageMetrics>({
    totalRequests: 0,
    totalCost: 0,
    activeUsers: 0,
    successRate: 0,
    avgResponseTime: 0
  })
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([])
  const [costTrends, setCostTrends] = useState<CostTrend[]>([])
  const [userEngagement, setUserEngagement] = useState<UserEngagement[]>([])
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadOverallMetrics(),
        loadFeatureUsage(),
        loadCostTrends(),
        loadUserEngagement()
      ])
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOverallMetrics = async () => {
    const dateFilter = getDateFilter()
    
    const { data: requests, error } = await supabase
      .from('ai_generation_requests')
      .select('*')
      .gte('created_at', dateFilter)

    if (error) throw error

    const totalRequests = requests?.length || 0
    const totalCost = requests?.reduce((sum, req) => sum + (req.cost_cents || 0), 0) || 0
    const successfulRequests = requests?.filter(req => req.status === 'completed').length || 0
    const avgResponseTime = requests?.reduce((sum, req) => sum + (req.processing_time_ms || 0), 0) / totalRequests || 0

    // Get unique users
    const { data: users } = await supabase
      .from('ai_generation_requests')
      .select('user_id')
      .gte('created_at', dateFilter)

    const activeUsers = new Set(users?.map(u => u.user_id)).size

    setMetrics({
      totalRequests,
      totalCost: totalCost / 100, // Convert cents to dollars
      activeUsers,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      avgResponseTime
    })
  }

  const loadFeatureUsage = async () => {
    const dateFilter = getDateFilter()
    
    const { data, error } = await supabase
      .from('ai_generation_requests')
      .select('feature, status, cost_cents')
      .gte('created_at', dateFilter)

    if (error) throw error

    const featureStats = data?.reduce((acc, req) => {
      if (!acc[req.feature]) {
        acc[req.feature] = { requests: 0, cost: 0, successful: 0 }
      }
      acc[req.feature].requests++
      acc[req.feature].cost += req.cost_cents || 0
      if (req.status === 'completed') {
        acc[req.feature].successful++
      }
      return acc
    }, {} as Record<string, any>) || {}

    const usage = Object.entries(featureStats).map(([feature, stats]: [string, any]) => ({
      feature,
      requests: stats.requests,
      cost: stats.cost / 100,
      successRate: stats.requests > 0 ? (stats.successful / stats.requests) * 100 : 0
    }))

    setFeatureUsage(usage)
  }

  const loadCostTrends = async () => {
    const dateFilter = getDateFilter()
    
    const { data, error } = await supabase
      .from('ai_generation_requests')
      .select('created_at, cost_cents')
      .gte('created_at', dateFilter)
      .order('created_at')

    if (error) throw error

    // Group by date
    const dailyStats = data?.reduce((acc, req) => {
      const date = new Date(req.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { cost: 0, requests: 0 }
      }
      acc[date].cost += req.cost_cents || 0
      acc[date].requests++
      return acc
    }, {} as Record<string, any>) || {}

    const trends = Object.entries(dailyStats).map(([date, stats]: [string, any]) => ({
      date,
      cost: stats.cost / 100,
      requests: stats.requests
    }))

    setCostTrends(trends)
  }

  const loadUserEngagement = async () => {
    const dateFilter = getDateFilter()
    
    // Get user subscription tiers and their usage
    const { data, error } = await supabase
      .from('ai_generation_requests')
      .select(`
        user_id,
        profiles!inner(subscription_tier)
      `)
      .gte('created_at', dateFilter)

    if (error) throw error

    const tierStats = data?.reduce((acc, req) => {
      const tier = req.profiles?.subscription_tier || 'free'
      if (!acc[tier]) {
        acc[tier] = { users: new Set(), requests: 0 }
      }
      acc[tier].users.add(req.user_id)
      acc[tier].requests++
      return acc
    }, {} as Record<string, any>) || {}

    const engagement = Object.entries(tierStats).map(([tier, stats]: [string, any]) => ({
      tier,
      users: stats.users.size,
      avgUsage: stats.users.size > 0 ? stats.requests / stats.users.size : 0
    }))

    setUserEngagement(engagement)
  }

  const getDateFilter = () => {
    const now = new Date()
    const days = parseInt(timeRange.replace('d', ''))
    const filterDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return filterDate.toISOString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (loading) {
    return <div className="p-6">Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Usage Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">1 Day</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalCost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.avgResponseTime)}ms</div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Line type="monotone" dataKey="cost" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="feature" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Engagement by Tier */}
        <Card>
          <CardHeader>
            <CardTitle>User Engagement by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userEngagement}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tier, users }) => `${tier}: ${users}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="users"
                >
                  {userEngagement.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Feature Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Feature</th>
                  <th className="text-left p-2">Requests</th>
                  <th className="text-left p-2">Cost</th>
                  <th className="text-left p-2">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {featureUsage.map((feature) => (
                  <tr key={feature.feature} className="border-b">
                    <td className="p-2 font-medium">{feature.feature}</td>
                    <td className="p-2">{feature.requests.toLocaleString()}</td>
                    <td className="p-2">{formatCurrency(feature.cost)}</td>
                    <td className="p-2">
                      <Badge 
                        variant={feature.successRate > 90 ? "default" : feature.successRate > 70 ? "secondary" : "destructive"}
                      >
                        {feature.successRate.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}