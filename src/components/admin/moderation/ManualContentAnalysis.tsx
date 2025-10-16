import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Search, Loader2 } from 'lucide-react';
import { useAutoFlagging } from '@/hooks/use-auto-flagging';
import { AutoFlaggingResult } from '@/lib/admin/auto-flagging-service';

export function ManualContentAnalysis() {
  const [contentType, setContentType] = useState<'brand' | 'cv'>('brand');
  const [contentId, setContentId] = useState('');
  const [userId, setUserId] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AutoFlaggingResult | null>(null);
  const { analyzeContent, isAnalyzing } = useAutoFlagging();

  const handleAnalyze = async () => {
    if (!contentId.trim() || !userId.trim()) {
      return;
    }

    const result = await analyzeContent(contentType, contentId.trim(), userId.trim());
    setAnalysisResult(result);
  };

  const getRiskLevelColor = (score: number) => {
    if (score >= 70) return 'destructive';
    if (score >= 40) return 'default';
    return 'secondary';
  };

  const getRiskLevelText = (score: number) => {
    if (score >= 70) return 'High Risk';
    if (score >= 40) return 'Medium Risk';
    return 'Low Risk';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual Content Analysis</CardTitle>
          <CardDescription>
            Analyze specific content for risk factors and potential policy violations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type</Label>
              <Select value={contentType} onValueChange={(value: 'brand' | 'cv') => setContentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="cv">CV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content-id">Content ID</Label>
              <Input
                id="content-id"
                placeholder="Enter content UUID"
                value={contentId}
                onChange={(e) => setContentId(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                placeholder="Enter user UUID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || !contentId.trim() || !userId.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-4">
          {/* Overall Risk Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {analysisResult.flagged ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                Analysis Results
              </CardTitle>
              <CardDescription>
                {analysisResult.flagged 
                  ? 'Content has been automatically flagged for review'
                  : 'Content passed automated analysis'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {analysisResult.risk_score.overall_score}
                  </div>
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                  <Badge variant={getRiskLevelColor(analysisResult.risk_score.overall_score)} className="mt-1">
                    {getRiskLevelText(analysisResult.risk_score.overall_score)}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {Math.round(analysisResult.risk_score.confidence * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {analysisResult.risk_score.risk_factors.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Risk Factors</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Risk Level</span>
                  <span>{analysisResult.risk_score.overall_score}/100</span>
                </div>
                <Progress value={analysisResult.risk_score.overall_score} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          {analysisResult.risk_score.risk_factors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Factors Detected</CardTitle>
                <CardDescription>
                  Specific issues identified during content analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.risk_score.risk_factors.map((factor, index) => (
                    <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(factor.severity)}>
                            {factor.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {factor.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {factor.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{factor.score}</div>
                        <p className="text-xs text-muted-foreground">Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Moderation Queue Info */}
          {analysisResult.moderation_queue_id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Moderation Queue</CardTitle>
                <CardDescription>
                  Content has been added to the moderation queue for review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Queue ID</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {analysisResult.moderation_queue_id}
                    </p>
                  </div>
                  <Badge variant="outline">Pending Review</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}