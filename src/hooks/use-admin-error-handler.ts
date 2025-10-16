import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';
import { useErrorHandler, useErrorToast } from '@/hooks/use-error-handler';
import { AppError, ErrorCode } from '@/lib/errors';

interface AdminErrorContext {
  action?: string;
  targetId?: string;
  targetType?: string;
  additionalContext?: Record<string, any>;
}

interface AdminErrorState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  context: AdminErrorContext | null;
}

export function useAdminErrorHandler() {
  const { user } = useAdmin();
  const { handleError } = useErrorHandler();
  const { showError, showWarning, showSuccess } = useErrorToast();
  const [errorState, setErrorState] = useState<AdminErrorState>({
    hasError: false,
    error: null,
    errorId: null,
    context: null,
  });

  const generateErrorId = useCallback(() => {
    return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const logAdminError = useCallback((
    error: Error,
    context: AdminErrorContext,
    errorId: string
  ) => {
    const adminErrorLog = {
      errorId,
      timestamp: new Date().toISOString(),
      adminUser: {
        id: user?.id,
        email: user?.email,
        role: user?.app_role,
      },
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    console.error('Admin Error Log:', adminErrorLog);

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error monitoring service
      // errorMonitoringService.captureAdminError(adminErrorLog);
    }
  }, [user]);

  const handleAdminError = useCallback((
    error: Error,
    context: AdminErrorContext = {}
  ) => {
    const errorId = generateErrorId();
    
    setErrorState({
      hasError: true,
      error,
      errorId,
      context,
    });

    logAdminError(error, context, errorId);

    // Handle specific admin error types
    if (error instanceof AppError) {
      switch (error.code) {
        case ErrorCode.INSUFFICIENT_PERMISSIONS:
          showError('Insufficient Permissions', {
            description: 'You don\'t have the required permissions for this action.',
            duration: 5000,
          });
          break;

        case ErrorCode.ADMIN_ACTION_FAILED:
          showError('Admin Action Failed', {
            description: error.message,
            duration: 5000,
            action: {
              label: 'Retry',
              onClick: () => {
                // Retry logic would be implemented by the calling component
                console.log('Retry requested for error:', errorId);
              },
            },
          });
          break;

        case ErrorCode.AUDIT_LOG_FAILURE:
          showError('Audit Log Error', {
            description: 'Action completed but audit logging failed. This has been reported.',
            duration: 6000,
          });
          break;

        case ErrorCode.BULK_OPERATION_PARTIAL_FAILURE:
          showWarning('Partial Success', {
            description: 'Some items in the bulk operation failed. Check the results.',
            duration: 5000,
          });
          break;

        case ErrorCode.EXTERNAL_SERVICE_ERROR:
          showError('External Service Error', {
            description: 'A third-party service is temporarily unavailable. Please try again later.',
            duration: 5000,
          });
          break;

        default:
          showError('Admin Error', {
            description: error.message,
            duration: 4000,
          });
      }
    } else {
      // Handle generic errors
      showError('Unexpected Error', {
        description: 'An unexpected error occurred. This has been logged for investigation.',
        duration: 4000,
      });
    }

    // Also use the general error handler
    handleError(error);
  }, [generateErrorId, logAdminError, showError, showWarning, handleError]);

  const handleBulkOperationError = useCallback((
    errors: Array<{ item: any; error: Error }>,
    context: AdminErrorContext = {}
  ) => {
    const errorId = generateErrorId();
    const bulkError = new AppError(
      `Bulk operation failed for ${errors.length} items`,
      ErrorCode.BULK_OPERATION_PARTIAL_FAILURE,
      { errors, totalFailed: errors.length }
    );

    setErrorState({
      hasError: true,
      error: bulkError,
      errorId,
      context: { ...context, bulkErrors: errors },
    });

    logAdminError(bulkError, context, errorId);

    showWarning('Bulk Operation Issues', {
      description: `${errors.length} items failed to process. Check the detailed results.`,
      duration: 6000,
    });
  }, [generateErrorId, logAdminError, showWarning]);

  const handlePermissionError = useCallback((
    requiredPermission: string,
    context: AdminErrorContext = {}
  ) => {
    const permissionError = new AppError(
      `Missing required permission: ${requiredPermission}`,
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      { requiredPermission, userRole: user?.app_role }
    );

    handleAdminError(permissionError, {
      ...context,
      action: 'permission_check',
      requiredPermission,
    });
  }, [user?.app_role, handleAdminError]);

  const handleAuditError = useCallback((
    originalAction: string,
    auditError: Error,
    context: AdminErrorContext = {}
  ) => {
    const auditFailure = new AppError(
      `Audit logging failed for action: ${originalAction}`,
      ErrorCode.AUDIT_LOG_FAILURE,
      { originalAction, auditError: auditError.message }
    );

    handleAdminError(auditFailure, {
      ...context,
      action: 'audit_logging',
      originalAction,
    });
  }, [handleAdminError]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorId: null,
      context: null,
    });
  }, []);

  const showSuccessMessage = useCallback((
    message: string,
    description?: string
  ) => {
    showSuccess(message, { description });
  }, [showSuccess]);

  const showWarningMessage = useCallback((
    message: string,
    description?: string
  ) => {
    showWarning(message, { description });
  }, [showWarning]);

  return {
    errorState,
    handleAdminError,
    handleBulkOperationError,
    handlePermissionError,
    handleAuditError,
    clearError,
    showSuccessMessage,
    showWarningMessage,
  };
}

// Specialized hooks for different admin operations
export function useUserManagementErrorHandler() {
  const baseHandler = useAdminErrorHandler();

  const handleUserActionError = useCallback((
    action: string,
    userId: string,
    error: Error
  ) => {
    baseHandler.handleAdminError(error, {
      action: `user_${action}`,
      targetId: userId,
      targetType: 'user',
    });
  }, [baseHandler]);

  const handleBulkUserActionError = useCallback((
    action: string,
    errors: Array<{ userId: string; error: Error }>
  ) => {
    const formattedErrors = errors.map(({ userId, error }) => ({
      item: { id: userId, type: 'user' },
      error,
    }));

    baseHandler.handleBulkOperationError(formattedErrors, {
      action: `bulk_user_${action}`,
      targetType: 'user',
    });
  }, [baseHandler]);

  return {
    ...baseHandler,
    handleUserActionError,
    handleBulkUserActionError,
  };
}

export function useContentModerationErrorHandler() {
  const baseHandler = useAdminErrorHandler();

  const handleModerationError = useCallback((
    action: string,
    contentId: string,
    contentType: string,
    error: Error
  ) => {
    baseHandler.handleAdminError(error, {
      action: `moderation_${action}`,
      targetId: contentId,
      targetType: contentType,
    });
  }, [baseHandler]);

  const handleBulkModerationError = useCallback((
    action: string,
    errors: Array<{ contentId: string; contentType: string; error: Error }>
  ) => {
    const formattedErrors = errors.map(({ contentId, contentType, error }) => ({
      item: { id: contentId, type: contentType },
      error,
    }));

    baseHandler.handleBulkOperationError(formattedErrors, {
      action: `bulk_moderation_${action}`,
      targetType: 'content',
    });
  }, [baseHandler]);

  return {
    ...baseHandler,
    handleModerationError,
    handleBulkModerationError,
  };
}

export function useSubscriptionManagementErrorHandler() {
  const baseHandler = useAdminErrorHandler();

  const handleSubscriptionError = useCallback((
    action: string,
    subscriptionId: string,
    error: Error
  ) => {
    baseHandler.handleAdminError(error, {
      action: `subscription_${action}`,
      targetId: subscriptionId,
      targetType: 'subscription',
    });
  }, [baseHandler]);

  const handleBillingError = useCallback((
    action: string,
    customerId: string,
    error: Error
  ) => {
    baseHandler.handleAdminError(error, {
      action: `billing_${action}`,
      targetId: customerId,
      targetType: 'customer',
    });
  }, [baseHandler]);

  return {
    ...baseHandler,
    handleSubscriptionError,
    handleBillingError,
  };
}

export function useSystemConfigErrorHandler() {
  const baseHandler = useAdminErrorHandler();

  const handleConfigError = useCallback((
    action: string,
    configKey: string,
    error: Error
  ) => {
    baseHandler.handleAdminError(error, {
      action: `config_${action}`,
      targetId: configKey,
      targetType: 'config',
    });
  }, [baseHandler]);

  return {
    ...baseHandler,
    handleConfigError,
  };
}