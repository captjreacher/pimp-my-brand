import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  Image as ImageIcon, 
  Mic, 
  Video,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { AIFeature, FeatureGate, QuotaStatus, SubscriptionTier } from '@/lib/ai/feature-gate'
import { supabase } from '@/integrations/supabase/client'

interface UsageData {
  feature: AIFeature
  count: number
  cost: number
  limit: number
  costLimit: number
}

interface UsageHistory {
  date: string
  imageGeneration: number
  voiceSynthesis: number
  videoGeneration: number
  totalCost: number
}

interface UsageTrackerProps {
  userId: string
  className?: string
}

export const UsageTracker: React.FC<UsageTrackerProps> = ({
  userId,
  className
}) => {
  const [currentUsage, setCurrentUsage] = useState<UsageData[]>([])
  const [usageHistory, setUsageHistory] = useState<UsageHistory[]>([])
  const [quotaStatus, setQuotaStatus] = useState<Record<AIFeature, QuotaStatus>>({} as any)
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(SubscriptionTier.FREE)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUsageData()
  }, [userId])

  const loadUsageData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadCurrentUsage(),
        loadUsageHistory(),
        loadQuotaStatus(),
        loadSubscriptionTier()
      ])
    } catch (error) {
      console.error('Error loading usage data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentUsage = async () => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const { data, error } = await supabase
      .from('ai_usage_tracking')
      .select('feature, usage_count, total_cost_cents')
      .eq('user_id', userId)
      .gte('period_start', monthStart.toISOString().split('T')[0])

    if (error) {
      console.error('Error loading current usage:', error)
      return
    }

    const usageData: UsageData[] = []
    const features = [AIFeature.IMAGE_GENERATION, AIFeature.VOICE_SYNTHESIS, AIFeature.VIDEO_GENERATION, AIFeature.ADVANCED_EDITING]

    for (const feature of features) {
      const usage = data?.find(d => d.feature === feature)
      const limit = await FeatureGate.getUsageLimit(userId, feature)
      
      usageData.push({
        feature,
        count: usage?.usage_count || 0,
        cost: usage?.total_cost_cents || 0,
        limit: limit.monthly,
        costLimit: limit.costLimit
      })
    }

    setCurrentUsage(usageData)
  }

  const loadUsageHistory = async () => {
    const { data, error } = await supabase
      .from('ai_usage_tracking')
      .select('period_start, feature, usage_count, total_cost_cents')
      .eq('user_id', userId)
      .order('period_start', { ascending: false })
      .limit(30)

    if (error) {
      console.error('Error loading usage history:', error)
      return
    }

    // Group by date and aggregate
    const historyMap = new Map<string, UsageHistory>()
    
    data?.forEach(record => {
      const date = record.period_start
      if (!historyMap.has(date)) {
        historyMap.set(date, {
          date,
          imageGeneration: 0,
          voiceSynthesis: 0,
          videoGeneration: 0,
          totalCost: 0
        })
      }

      const entry = historyMap.get(date)!
      entry.totalCost += record.total_cost_cents

      switch (record.feature) {
        case AIFeature.IMAGE_GENERATION:
          entry.imageGeneration += record.usage_count
          break
        case AIFeature.VOICE_SYNTHESIS:
          entry.voiceSynthesis += record.usage_count
          break
        case AIFeature.VIDEO_GENERATION:
          entry.videoGeneration += record.usage_count
          break
      }
    })

    setUsageHistory(Array.from(historyMap.values()).slice(0, 7))
  }

  const loadQuotaStatus = async () => {
    const features = [AIFeature.IMAGE_GENERATION, AIFeature.VOICE_SYNTHESIS, AIFeature.VIDEO_GENERATION, AIFeature.ADVANCED_EDITING]
    const quotas: Record<AIFeature, QuotaStatus> = {} as any

    for (const feature of features) {
      quotas[feature] = await FeatureGate.checkQuota(userId, feature)
    }

    setQuotaStatus(quotas)
  }

  const loadSubscriptionTier = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    setSubscriptionTier((data?.subscription_tier as SubscriptionTier) || SubscriptionTier.FREE)
  }

  const getFeatureIcon = (feature: AIFeature) => {
    switch (feature) {
      case AIFeature.IMAGE_GENERATION:
        return <ImageIcon className="w-4 h-4" />
      case AIFeature.VOICE_SYNTHESIS:
        return <Mic className="w-4 h-4" />
      case AIFeature.VIDEO_GENERATION:
        return <Video className="w-4 h-4" />
      default:
        return <TrendingUp className="w-4 h-4" />
    }
  }

  const getFeatureName = (feature: AIFeature) => {
    switch (feature) {
      case AIFeature.IMAGE_GENERATION:
        return 'Image Generation'
      case AIFeature.VOICE_SYNTHESIS:
        return 'Voice Synthesis'
      case AIFeature.VIDEO_GENERATION:
        return 'Video Generation'
      default:
        return feature
    }
  }

  const formatCost = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.FREE:
        return 'bg-gray-500'
      case SubscriptionTier.TIER_1:
        return 'bg-blue-500'
      case SubscriptionTier.TIER_2:
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300']

  if (isLoading) {
    return (
      <div className={`usage-tracker ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`usage-tracker space-y-6 ${className}`}>
      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Subscription Status</span>
            <Badge className={getTierColor(subscriptionTier)}>
              {subscriptionTier.toUpperCase().replace('_', ' ')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentUsage.map((usage) => {
              const quota = quotaStatus[usage.feature]
              const usagePercent = (usage.count / usage.limit) * 100
              const costPercent = (usage.cost / usage.costLimit) * 100
              const isNearLimit = usagePercent > 80 || costPercent > 80

              return (
                <Card key={usage.feature} className={isNearLimit ? 'border-orange-200' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getFeatureIcon(usage.feature)}
                        <span className="font-medium text-sm">
                          {getFeatureName(usage.feature)}
                        </span>
                      </div>
                      {isNearLimit && (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Usage</span>
                          <span>{usage.count} / {usage.limit}</span>
                        </div>
                        <Progress value={usagePercent} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Cost</span>
                          <span>{formatCost(usage.cost)} / {formatCost(usage.costLimit)}</span>
                        </div>
                        <Progress value={costPercent} className="h-2" />
                      </div>
                    </div>

                    {quota && !quota.canUse && (
                      <Badge variant="destructive" className="mt-2 text-xs">
                        {quota.reason}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usage Analytics */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">
            <Calendar className="w-4 h-4 mr-2" />
            Usage History
          </TabsTrigger>
          <TabsTrigger value="breakdown">
            <TrendingUp className="w-4 h-4 mr-2" />
            Cost Breakdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Usage History</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usageHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="imageGeneration" fill="#8884d8" name="Images" />
                  <Bar dataKey="voiceSynthesis" fill="#82ca9d" name="Voice" />
                  <Bar dataKey="videoGeneration" fill="#ffc658" name="Video" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={currentUsage.map((usage, index) => ({
                        name: getFeatureName(usage.feature),
                        value: usage.cost,
                        fill: pieColors[index % pieColors.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${formatCost(value)}`}
                    >
                      {currentUsage.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCost(value as number)} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">Total Monthly Cost</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatCost(currentUsage.reduce((sum, usage) => sum + usage.cost, 0))}
                  </div>
                  <div className="text-sm text-gray-600">
                    Limit: {formatCost(currentUsage.reduce((sum, usage) => sum + usage.costLimit, 0))}
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    {currentUsage.map((usage, index) => (
                      <div key={usage.feature} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: pieColors[index % pieColors.length] }}
                          />
                          <span className="text-sm">{getFeatureName(usage.feature)}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCost(usage.cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade Prompt */}
      {subscriptionTier === SubscriptionTier.FREE && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Upgrade Your Plan</h3>
                <p className="text-sm text-blue-700">
                  Get more AI generations and unlock advanced features
                </p>
              </div>
              <Button variant="default" size="sm">
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}