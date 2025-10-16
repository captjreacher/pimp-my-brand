import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, ArrowLeft, Home, LogIn, AlertTriangle } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';

interface UnauthorizedAccessProps {
  title?: string;
  message?: string;
  showLoginOption?: boolean;
  showBackButton?: boolean;
  requiredRole?: string;
  requiredPermissions?: string[];
}

export function UnauthorizedAccess({
  title = 'Access Denied',
  message,
  showLoginOption = true,
  showBackButton = true,
  requiredRole,
  requiredPermissions = []
}: UnauthorizedAccessProps) {
  const { user, login } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  // Get error details from location state if available
  const locationError = location.state?.error;
  const fromPath = location.state?.from;

  const getDefaultMessage = () => {
    if (!user) {
      return 'You need to be logged in with admin privileges to access this page.';
    }

    if (user.app_role === 'user') {
      return 'This page requires admin privileges. Your current account does not have the necessary permissions.';
    }

    if (requiredRole) {
      return `This page requires ${requiredRole.replace('_', ' ')} privileges. Your current role is ${user.app_role.replace('_', ' ')}.`;
    }

    if (requiredPermissions.length > 0) {
      return `This page requires the following permissions: ${requiredPermissions.join(', ')}. Please contact your administrator if you believe you should have access.`;
    }

    return 'You do not have permission to access this page.';
  };

  const displayMessage = message || locationError || getDefaultMessage();

  const handleLogin = async () => {
    try {
      await login();
      // After successful login, try to navigate back to the original page
      if (fromPath) {
        navigate(fromPath);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
            {title}
          </CardTitle>
          <CardDescription className="text-base">
            {displayMessage}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Show additional context if available */}
          {(requiredRole || requiredPermissions.length > 0) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Requirements</AlertTitle>
              <AlertDescription>
                {requiredRole && (
                  <div>Required role: <strong>{requiredRole.replace('_', ' ')}</strong></div>
                )}
                {requiredPermissions.length > 0 && (
                  <div>Required permissions: <strong>{requiredPermissions.join(', ')}</strong></div>
                )}
                {user && (
                  <div className="mt-2">
                    Your current role: <strong>{user.app_role.replace('_', ' ')}</strong>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {/* Show login button if user is not authenticated */}
            {!user && showLoginOption && (
              <Button onClick={handleLogin} className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Login as Admin
              </Button>
            )}

            {/* Show back button */}
            {showBackButton && (
              <Button variant="outline" onClick={handleGoBack} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            )}

            {/* Show dashboard link */}
            <Button variant="outline" asChild className="w-full">
              <Link to="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>

            {/* Show admin dashboard link if user has some admin privileges */}
            {user && user.app_role !== 'user' && (
              <Button variant="outline" asChild className="w-full">
                <Link to="/admin">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Link>
              </Button>
            )}
          </div>

          {/* Help text */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              If you believe you should have access to this page, please contact your administrator.
            </p>
            {fromPath && (
              <p className="mt-1">
                Attempted to access: <code className="text-xs bg-muted px-1 py-0.5 rounded">{fromPath}</code>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Convenience components for specific scenarios
export function AdminLoginRequired(props: Omit<UnauthorizedAccessProps, 'title' | 'showLoginOption'>) {
  return (
    <UnauthorizedAccess
      title="Admin Login Required"
      showLoginOption={true}
      {...props}
    />
  );
}

export function InsufficientRole({ 
  requiredRole, 
  ...props 
}: Omit<UnauthorizedAccessProps, 'title'> & { requiredRole: string }) {
  return (
    <UnauthorizedAccess
      title="Insufficient Role"
      requiredRole={requiredRole}
      showLoginOption={false}
      {...props}
    />
  );
}

export function MissingPermissions({ 
  requiredPermissions, 
  ...props 
}: Omit<UnauthorizedAccessProps, 'title'> & { requiredPermissions: string[] }) {
  return (
    <UnauthorizedAccess
      title="Missing Permissions"
      requiredPermissions={requiredPermissions}
      showLoginOption={false}
      {...props}
    />
  );
}