import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  adminContext?: {
    userId?: string;
    role?: string;
    permissions?: string[];
    currentPage?: string;
  };
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `admin_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AdminErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log admin-specific error context
    const adminErrorReport = {
      errorId: this.state.errorId,
      error: {
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      adminContext: this.props.adminContext,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('Admin Error Report:', adminErrorReport);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send to error reporting service with admin context
    if (process.env.NODE_ENV === 'production') {
      this.reportAdminError(adminErrorReport);
    }
  }

  private reportAdminError = (errorReport: any) => {
    // Send to error reporting service with admin-specific tags
    // This would typically integrate with services like Sentry, LogRocket, etc.
    console.error('Admin Error Report for monitoring:', errorReport);
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoToAdminDashboard = () => {
    window.location.href = '/admin';
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleReportBug = () => {
    const subject = encodeURIComponent(`Admin Bug Report: ${this.state.error?.message || 'Unknown Error'}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Admin Context: ${JSON.stringify(this.props.adminContext, null, 2)}
Error Message: ${this.state.error?.message || 'Unknown'}
Stack Trace: ${this.state.error?.stack || 'Not available'}
Component Stack: ${this.state.errorInfo?.componentStack || 'Not available'}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}

Please describe what admin action you were performing when this error occurred:
[Your description here]
    `);
    
    window.open(`mailto:admin-support@example.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Admin-specific error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl text-red-900 dark:text-red-100">
                Admin Panel Error
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                An error occurred in the admin panel. This has been logged for investigation.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  <strong>Message:</strong> {this.state.error?.message || 'An unknown error occurred'}
                </AlertDescription>
              </Alert>

              {this.state.errorId && (
                <Alert>
                  <AlertDescription>
                    <strong>Error ID:</strong> <code className="bg-muted px-1 py-0.5 rounded text-xs">{this.state.errorId}</code>
                    <br />
                    <small className="text-muted-foreground">
                      Please include this ID when reporting the issue to admin support
                    </small>
                  </AlertDescription>
                </Alert>
              )}

              {/* Admin Context Information */}
              {this.props.adminContext && (
                <Alert>
                  <AlertTitle>Admin Context</AlertTitle>
                  <AlertDescription className="space-y-1">
                    {this.props.adminContext.role && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Role:</span>
                        <Badge variant="secondary">{this.props.adminContext.role}</Badge>
                      </div>
                    )}
                    {this.props.adminContext.currentPage && (
                      <div className="text-sm">
                        <span>Page:</span> <code className="bg-muted px-1 py-0.5 rounded text-xs">{this.props.adminContext.currentPage}</code>
                      </div>
                    )}
                    {this.props.adminContext.permissions && this.props.adminContext.permissions.length > 0 && (
                      <div className="text-sm">
                        <span>Permissions:</span> {this.props.adminContext.permissions.join(', ')}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button variant="outline" onClick={this.handleGoToAdminDashboard} className="flex-1">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Button>
                
                <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  Main Dashboard
                </Button>
              </div>

              <div className="flex justify-center pt-2">
                <Button variant="ghost" size="sm" onClick={this.handleReportBug}>
                  <Bug className="w-4 h-4 mr-2" />
                  Report to Admin Support
                </Button>
              </div>

              {this.props.showDetails && process.env.NODE_ENV === 'development' && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                    Technical Details (Development Only)
                  </summary>
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    <div className="text-sm font-mono">
                      <div className="mb-2">
                        <strong>Error:</strong> {this.state.error?.message}
                      </div>
                      <div className="mb-2">
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 text-xs overflow-auto max-h-40">
                          {this.state.error?.stack}
                        </pre>
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 text-xs overflow-auto max-h-40">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                      {this.props.adminContext && (
                        <div className="mt-2">
                          <strong>Admin Context:</strong>
                          <pre className="mt-1 text-xs overflow-auto">
                            {JSON.stringify(this.props.adminContext, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized admin error boundaries for different sections
export const AdminDashboardErrorBoundary: React.FC<{ children: ReactNode; adminContext?: any }> = ({ 
  children, 
  adminContext 
}) => (
  <AdminErrorBoundary
    adminContext={{ ...adminContext, currentPage: 'Admin Dashboard' }}
    showDetails={true}
  >
    {children}
  </AdminErrorBoundary>
);

export const UserManagementErrorBoundary: React.FC<{ children: ReactNode; adminContext?: any }> = ({ 
  children, 
  adminContext 
}) => (
  <AdminErrorBoundary
    adminContext={{ ...adminContext, currentPage: 'User Management' }}
    fallback={
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          User Management Error
        </h2>
        <p className="text-gray-600 mb-4">
          There was an error loading the user management interface. Please try refreshing the page.
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Page
        </Button>
      </div>
    }
  >
    {children}
  </AdminErrorBoundary>
);

export const ContentModerationErrorBoundary: React.FC<{ children: ReactNode; adminContext?: any }> = ({ 
  children, 
  adminContext 
}) => (
  <AdminErrorBoundary
    adminContext={{ ...adminContext, currentPage: 'Content Moderation' }}
    fallback={
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Moderation Panel Error
        </h2>
        <p className="text-gray-600 mb-4">
          The content moderation interface encountered an error. Your moderation queue may be temporarily unavailable.
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reload Moderation Panel
        </Button>
      </div>
    }
  >
    {children}
  </AdminErrorBoundary>
);

export const AnalyticsErrorBoundary: React.FC<{ children: ReactNode; adminContext?: any }> = ({ 
  children, 
  adminContext 
}) => (
  <AdminErrorBoundary
    adminContext={{ ...adminContext, currentPage: 'Analytics' }}
    fallback={
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Analytics Unavailable
        </h2>
        <p className="text-gray-600 mb-4">
          We're having trouble loading the analytics dashboard. Data collection is still running normally.
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Loading Analytics
        </Button>
      </div>
    }
  >
    {children}
  </AdminErrorBoundary>
);