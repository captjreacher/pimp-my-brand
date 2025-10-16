// Error reporting and user feedback components
import React, { useState } from 'react';
import { Bug, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useErrorToast } from '@/hooks/use-error-handler';
import { AppError } from '@/lib/errors';

interface ErrorReportData {
  type: 'bug' | 'feature' | 'feedback';
  title: string;
  description: string;
  email?: string;
  includeSystemInfo: boolean;
  error?: AppError;
}

interface ErrorReportingProps {
  error?: AppError;
  trigger?: React.ReactNode;
  onSubmit?: (report: ErrorReportData) => Promise<void>;
}

export const ErrorReporting: React.FC<ErrorReportingProps> = ({
  error,
  trigger,
  onSubmit,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ErrorReportData>({
    type: error ? 'bug' : 'feedback',
    title: error ? `Error: ${error.message}` : '',
    description: '',
    email: '',
    includeSystemInfo: true,
    error,
  });

  const { showSuccess, showError } = useErrorToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      showError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default submission (e.g., email or API call)
        await submitErrorReport(formData);
      }
      
      showSuccess('Thank you for your feedback! We\'ll look into it.');
      setOpen(false);
      
      // Reset form
      setFormData({
        type: 'feedback',
        title: '',
        description: '',
        email: '',
        includeSystemInfo: true,
      });
    } catch (err) {
      showError('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSystemInfo = () => {
    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
    };
  };

  const submitErrorReport = async (report: ErrorReportData) => {
    const reportData = {
      ...report,
      systemInfo: report.includeSystemInfo ? getSystemInfo() : undefined,
      errorDetails: report.error ? {
        code: report.error.code,
        message: report.error.message,
        severity: report.error.severity,
        context: report.error.context,
        stack: report.error.stack,
        timestamp: report.error.timestamp,
      } : undefined,
    };

    // In a real app, this would send to your error reporting service
    console.log('Error Report Submitted:', reportData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Bug className="w-4 h-4 mr-2" />
      Report Issue
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Report an Issue
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting bugs, requesting features, or sharing feedback.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'bug' | 'feature' | 'feedback') =>
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
                <SelectItem value="feedback">General Feedback</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Please provide detailed information about the issue, including steps to reproduce if applicable"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
            />
            <p className="text-xs text-gray-500">
              We'll only use this to follow up on your report
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="systemInfo"
              checked={formData.includeSystemInfo}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, includeSystemInfo: checked as boolean }))
              }
            />
            <Label htmlFor="systemInfo" className="text-sm">
              Include system information (browser, OS, etc.)
            </Label>
          </div>

          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-800">Error Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-red-700 space-y-1">
                  <div><strong>Code:</strong> {error.code}</div>
                  <div><strong>Message:</strong> {error.message}</div>
                  <div><strong>Severity:</strong> {error.severity}</div>
                  {error.context && (
                    <div><strong>Context:</strong> {JSON.stringify(error.context, null, 2)}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Quick error report button for error boundaries
export const QuickErrorReport: React.FC<{ error?: AppError }> = ({ error }) => {
  const [submitted, setSubmitted] = useState(false);
  const { showSuccess } = useErrorToast();

  const handleQuickReport = async () => {
    try {
      const report: ErrorReportData = {
        type: 'bug',
        title: `Quick Report: ${error?.message || 'Unknown Error'}`,
        description: 'User encountered an error and used quick report',
        includeSystemInfo: true,
        error,
      };

      // Submit report
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      setSubmitted(true);
      showSuccess('Error reported. Thank you!');
    } catch (err) {
      console.error('Failed to submit quick report:', err);
    }
  };

  if (submitted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Bug className="w-4 h-4 mr-2" />
        Reported
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleQuickReport}>
      <Bug className="w-4 h-4 mr-2" />
      Quick Report
    </Button>
  );
};

// Error feedback widget for collecting user feedback on errors
export const ErrorFeedbackWidget: React.FC<{
  errorId: string;
  onFeedback?: (feedback: { helpful: boolean; comment?: string }) => void;
}> = ({ errorId, onFeedback }) => {
  const [feedback, setFeedback] = useState<{ helpful?: boolean; comment?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (helpful: boolean) => {
    const feedbackData = { helpful, comment: feedback.comment };
    setFeedback(feedbackData);
    
    if (onFeedback) {
      await onFeedback(feedbackData);
    }
    
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-sm text-gray-500 text-center py-2">
        Thank you for your feedback!
      </div>
    );
  }

  return (
    <div className="border-t pt-3 mt-3">
      <p className="text-sm text-gray-600 mb-2">Was this error message helpful?</p>
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleFeedback(true)}
        >
          Yes
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleFeedback(false)}
        >
          No
        </Button>
      </div>
    </div>
  );
};