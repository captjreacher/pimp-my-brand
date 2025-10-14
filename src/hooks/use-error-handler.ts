// React hooks for error handling
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { 
  AppError, 
  ErrorCode, 
  ErrorSeverity,
  globalErrorHandler,
  withRetry,
  RetryOptions,
  defaultRetryCondition,
} from '@/lib/errors';

// Hook for handling errors in components
export function useErrorHandler() {
  const handleError = useCallback((error: Error) => {
    globalErrorHandler.handleError(error);
  }, []);

  const handleAsyncError = useCallback(async (error: Error) => {
    await globalErrorHandler.handleError(error);
  }, []);

  return { handleError, handleAsyncError };
}

// Hook for async operations with error handling
export function useAsyncOperation<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { handleError } = useErrorHandler();

  const execute = useCallback(async (operation: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
}

// Hook for operations with retry capability
export function useRetryableOperation<T>(retryOptions?: Partial<RetryOptions>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { handleError } = useErrorHandler();

  const defaultOptions: RetryOptions = {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    retryCondition: defaultRetryCondition,
    ...retryOptions,
  };

  const execute = useCallback(async (operation: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    setRetryCount(0);
    
    try {
      const result = await withRetry(async () => {
        setRetryCount(prev => prev + 1);
        return await operation();
      }, defaultOptions);
      
      setData(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, defaultOptions]);

  const retry = useCallback(async (operation: () => Promise<T>) => {
    if (!error) return;
    return execute(operation);
  }, [error, execute]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
    setRetryCount(0);
  }, []);

  return {
    loading,
    error,
    data,
    retryCount,
    execute,
    retry,
    reset,
  };
}

// Hook for form validation errors
export function useFormErrorHandler() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleValidationError = useCallback((error: Error) => {
    if (error instanceof AppError && error.code === ErrorCode.VALIDATION_ERROR) {
      // Handle validation errors
      const context = error.context as { field?: string };
      if (context?.field) {
        setFieldErrors(prev => ({
          ...prev,
          [context.field!]: error.message,
        }));
      } else {
        setGeneralError(error.message);
      }
    } else {
      setGeneralError(error.message);
    }
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
    setGeneralError(null);
  }, []);

  const hasErrors = Object.keys(fieldErrors).length > 0 || generalError !== null;

  return {
    fieldErrors,
    generalError,
    hasErrors,
    handleValidationError,
    clearFieldError,
    clearAllErrors,
  };
}

// Hook for file upload error handling
export function useFileUploadErrorHandler() {
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const { handleError } = useErrorHandler();

  const handleFileError = useCallback((fileName: string, error: Error) => {
    setUploadErrors(prev => ({
      ...prev,
      [fileName]: error.message,
    }));
    handleError(error);
  }, [handleError]);

  const clearFileError = useCallback((fileName: string) => {
    setUploadErrors(prev => {
      const { [fileName]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllFileErrors = useCallback(() => {
    setUploadErrors({});
  }, []);

  const hasFileErrors = Object.keys(uploadErrors).length > 0;

  return {
    uploadErrors,
    hasFileErrors,
    handleFileError,
    clearFileError,
    clearAllFileErrors,
  };
}

// Hook for AI operation error handling
export function useAIErrorHandler() {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitResetTime, setRateLimitResetTime] = useState<Date | null>(null);
  const { handleError } = useErrorHandler();

  const handleAIError = useCallback((error: Error) => {
    if (error instanceof AppError && error.code === ErrorCode.AI_RATE_LIMIT_EXCEEDED) {
      setIsRateLimited(true);
      // Set reset time to 5 minutes from now (adjust based on actual rate limit)
      setRateLimitResetTime(new Date(Date.now() + 5 * 60 * 1000));
    }
    handleError(error);
  }, [handleError]);

  // Reset rate limit status when time expires
  useEffect(() => {
    if (rateLimitResetTime && isRateLimited) {
      const timeUntilReset = rateLimitResetTime.getTime() - Date.now();
      if (timeUntilReset > 0) {
        const timeout = setTimeout(() => {
          setIsRateLimited(false);
          setRateLimitResetTime(null);
        }, timeUntilReset);
        return () => clearTimeout(timeout);
      } else {
        setIsRateLimited(false);
        setRateLimitResetTime(null);
      }
    }
  }, [rateLimitResetTime, isRateLimited]);

  return {
    isRateLimited,
    rateLimitResetTime,
    handleAIError,
  };
}

// Hook for network error handling
export function useNetworkErrorHandler() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNetworkError = useCallback((error: Error) => {
    if (isOffline) {
      toast.error('You are offline. Please check your internet connection.');
    } else {
      handleError(error);
    }
  }, [isOffline, handleError]);

  return {
    isOffline,
    handleNetworkError,
  };
}

// Hook for toast notifications with error context
export function useErrorToast() {
  const showError = useCallback((
    message: string, 
    options?: {
      description?: string;
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
    }
  ) => {
    toast.error(message, {
      duration: options?.duration || 4000,
      description: options?.description,
      action: options?.action,
    });
  }, []);

  const showWarning = useCallback((
    message: string,
    options?: {
      description?: string;
      duration?: number;
    }
  ) => {
    toast.warning(message, {
      duration: options?.duration || 3000,
      description: options?.description,
    });
  }, []);

  const showSuccess = useCallback((
    message: string,
    options?: {
      description?: string;
      duration?: number;
    }
  ) => {
    toast.success(message, {
      duration: options?.duration || 2000,
      description: options?.description,
    });
  }, []);

  return {
    showError,
    showWarning,
    showSuccess,
  };
}