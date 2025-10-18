import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react'
import { AIContentModerationService } from '@/lib/ai/content-moderation-service'
import { supabase } from '@/integrations/supabase/client'

interface FlaggedContent {
  id: string
  request_id: string
  user_id: string
  flagged: boolean
  categories: string[]
  confidence: number
  reason?: string
  created_at: string
  ai_generation_requests: {
    feature: string
    prompt?: string
    result_url?: string
    status: string
  }
  review_status?: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
}

export const ContentReviewInterface: React.FC = () => {
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContent, setSelectedContent] = useState<FlaggedContent | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const moderationService = new AIContentModerationService()

  useEffect(() => {
    loadFlaggedContent()
  }, [filterStatus])

  const loadFlaggedContent = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('ai_moderation_logs')
        .select(`
          *,
          ai_generation_requests(*)
        `)
        .eq('flagged', true)
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('review_status', filterStatus)
      }

      const { data, error } = await query
      if (error) throw error
      setFlaggedContent(data || [])
    } catch (error) {
      console.error('Failed to load flagged content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (contentId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('ai_moderation_logs')
        .update({
          review_status: action === 'approve' ? 'approved' : 'rejected',
          admin_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', contentId)

      if (error) throw error

      // If rejecting, also update the generation request status
      if (action === 'reject') {
        const content = flaggedContent.find(c => c.id === contentId)
        if (content) {
          await supabase
            .from('ai_generation_requests')
            .update({ status: 'rejected' })
            .eq('id', content.request_id)
        }
      }

      setReviewNotes('')
      setSelectedContent(null)
      loadFlaggedContent()
    } catch (error) {
      console.error('Failed to review content:', error)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      violence: 'bg-red-100 text-red-800',
      adult: 'bg-purple-100 text-purple-800',
      hate: 'bg-orange-100 text-orange-800',
      harassment: 'bg-yellow-100 text-yellow-800',
      'self-harm': 'bg-pink-100 text-pink-800',
      illegal: 'bg-gray-100 text-gray-800',
      error: 'bg-blue-100 text-blue-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  if (loading) {
    return <div className="p-6">Loading flagged content...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Content Review Queue</h2>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Content</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {flaggedContent.map((content) => (
          <Card key={content.id} className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(content.review_status)}
                    <CardTitle className="text-lg">
                      {content.ai_generation_requests?.feature || 'Unknown'} Request
                    </CardTitle>
                    <Badge variant="outline">
                      Confidence: {Math.round(content.confidence * 100)}%
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {content.categories.map((category) => (
                      <Badge key={category} className={getCategoryColor(category)}>
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedContent(content)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Review
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>User ID:</strong> {content.user_id}</p>
                <p><strong>Created:</strong> {new Date(content.created_at).toLocaleString()}</p>
                {content.reason && <p><strong>Reason:</strong> {content.reason}</p>}
                {content.ai_generation_requests?.prompt && (
                  <p><strong>Prompt:</strong> {content.ai_generation_requests.prompt}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Review Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Content Details</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Feature:</strong> {selectedContent.ai_generation_requests?.feature}</p>
                  <p><strong>Confidence:</strong> {Math.round(selectedContent.confidence * 100)}%</p>
                  <p><strong>Categories:</strong> {selectedContent.categories.join(', ')}</p>
                  {selectedContent.reason && <p><strong>Reason:</strong> {selectedContent.reason}</p>}
                </div>
              </div>

              {selectedContent.ai_generation_requests?.prompt && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Original Prompt</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    {selectedContent.ai_generation_requests.prompt}
                  </div>
                </div>
              )}

              {selectedContent.ai_generation_requests?.result_url && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Generated Content</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <a 
                      href={selectedContent.ai_generation_requests.result_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Generated Content
                    </a>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-semibold">Review Notes</h3>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your review decision..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedContent(null)
                    setReviewNotes('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => handleReview(selectedContent.id, 'approve')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => handleReview(selectedContent.id, 'reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}