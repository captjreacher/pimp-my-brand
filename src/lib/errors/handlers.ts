// Error handling utilities and recovery mechanisms
import { toast } from 'sonner';
import { 
  AppError, 
  ErrorCode, 
  ErrorSeverity, 
  ValidationError,
  FileProcessingError,
  AIServiceError,
  AuthenticationError,
  DatabaseError,
  StorageError,
  ExportError,
  NetworkError,
  ErrorRecoveryAction,
} from './types';

// Error message mappings for user-friendly messages
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Validation errors
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again',
  [ErrorCode.INVALID_INPUT]: 'The provided information is not valid',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields',
  
  // File processing errors
  [ErrorCode.FILE_TOO_LARGE]: 'File is too large. Please choose a smaller file',
  [ErrorCode.UNSUPPORTED_FILE_TYPE]: 'File type not supported. Please use PDF, DOCX, or text files',
  [ErrorCode.FILE_PROCESSING_FAILED]: 'Failed to process the file. Please try again',
  [ErrorCode.TEXT_EXTRACTION_FAILED]: 'Could not extract text from the file',
  [ErrorCode.OCR_PROCESSING_FAILED]: 'Failed to read text from the image',
  
  // AI service errors
  [ErrorCode.AI_SERVICE_UNAVAILABLE]: 'AI service is temporarily unavailable. Please try again later',
  [ErrorCode.AI_RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again',
  [ErrorCode.AI_ANALYSIS_FAILED]: 'Failed to analyze your content. Please try again',
  [ErrorCode.AI_GENERATION_FAILED]: 'Failed to generate brand materials. Please try again',
  [ErrorCode.AI_INVALID_RESPONSE]: 'Received invalid response from AI service',
  
  // Authentication errors
  [ErrorCode.AUTHENTICATION_REQUIRED]: 'Please sign in to continue',
  [ErrorCode.AUTHENTICATION_FAILED]: 'Sign in failed. Please check your credentials',
  [ErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please sign in again',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action',
  
  // Database errors
  [ErrorCode.DATABASE_CONNECTION_FAILED]: 'Database connection failed. Please try again',
  [ErrorCode.RECORD_NOT_FOUND]: 'The requested item was not found',
  [ErrorCode.DUPLICATE_RECORD]: 'This item already exists',
  [ErrorCode.DATABASE_CONSTRAINT_VIOLATION]: 'Data constraint violation',
  
  // Storage errors
  [ErrorCode.STORAGE_UPLOAD_FAILED]: 'Failed to upload file. Please try again',
  [ErrorCode.STORAGE_DOWNLOAD_FAILED]: 'Failed to download file',
  [ErrorCode.STORAGE_DELETE_FAILED]: 'Failed to delete file',
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: 'Storage quota exceeded',
  
  // Export errors
  [ErrorCode.PDF_GENERATION_FAILED]: 'Failed to generate PDF. Please try again',
  [ErrorCode.PNG_GENERATION_FAILED]: 'Failed to generate image. Please try again',
  [ErrorCode.EXPORT_PROCESSING_FAILED]: 'Export failed. Please try again',
  
  // Network errors
  [ErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection',
  [ErrorCode.REQUEST_TIMEOUT]: 'Request timed out. Please try again',
  [ErrorCode.SERVER_ERROR]: 'Server error. Please try again later',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable',
  
  // Generic errors
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred',
  [ErrorCode.OPERATION_FAILED]: 'Operation failed. Please try again',
  [ErrorCode.CONFIGURATION_ERROR]: 'Configuration error',
};

// Error handler interface
export interface ErrorHandler {
  canHandle(error: Error): boolean;
  handle(error: Error): Promise<void> | void;
}

// Global error handler
export class GlobalErrorHandler {
  private handlers: ErrorHandler[] = [];
  private errorReportingEnabled = process.env.NODE_ENV === 'production';

  addHandler(handler: ErrorHandler) {
    this.handlers.push(handler);
  }

  removeHandler(handler: ErrorHandler) {
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
  }

  async handleError(error: Error): Promise<void> {
    // Log error
    console.error('GlobalErrorHandler:', error);

    // Find appropriate handler
    const handler = this.handlers.find(h => h.canHandle(error));
    if (handler) {
      try {
        await handler.handle(error);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    } else {
      // Default handling
      await this.defaultHandle(error);
    }

    // Report error if enabled
    if (this.errorReportingEnabled) {
      this.reportError(error);
    }
  }

  private async defaultHandle(error: Error): Promise<void> {
    if (error instanceof AppError) {
      this.handleAppError(error);
    } else {
      this.handleGenericError(error);
    }
  }

  private handleAppError(error: AppError): void {
    const message = error.userMessage || ERROR_MESSAGES[error.code] || error.message;
    
    switch (error.severity) {
      case ErrorSeverity.LOW:
        toast.info(message);
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(message);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        toast.error(message, {
          duration: 5000,
          action: error.recoveryActions?.[0] ? {
            label: error.recoveryActions[0].label,
            onClick: error.recoveryActions[0].action,
          } : undefined,
        });
        break;
    }
  }

  private handleGenericError(error: Error): void {
    toast.error('An unexpected error occurred. Please try again.');
  }

  private reportError(error: Error): void {
    // This would typically send to an error reporting service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...(error instanceof AppError ? error.toJSON() : {}),
    };

    // Example: Send to error reporting service
    // errorReportingService.captureException(error, { extra: errorReport });
    console.log('Error Report:', errorReport);
  }
}

// Create global instance
export const globalErrorHandler = new GlobalErrorHandler();

// Specific error handlers
export class ValidationErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error instanceof ValidationError;
  }

  handle(error: ValidationError): void {
    const message = error.userMessage || `Validation error: ${error.message}`;
    toast.error(message);
  }
}

export class FileProcessingErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error instanceof FileProcessingError;
  }

  handle(error: FileProcessingError): void {
    const message = error.userMessage || ERROR_MESSAGES[error.code];
    toast.error(message, {
      duration: 4000,
      action: error.retryable ? {
        label: 'Retry',
        onClick: () => {
          // Retry logic would be provided by the component
          console.log('Retry file processing');
        },
      } : undefined,
    });
  }
}

export class AIServiceErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error instanceof AIServiceError;
  }

  handle(error: AIServiceError): void {
    const message = error.userMessage || ERROR_MESSAGES[error.code];
    
    if (error.code === ErrorCode.AI_RATE_LIMIT_EXCEEDED) {
      toast.error(message, {
        duration: 6000,
        description: 'Please wait a few minutes before trying again',
      });
    } else {
      toast.error(message, {
        duration: 5000,
        action: error.retryable ? {
          label: 'Retry',
          onClick: () => {
            console.log('Retry AI operation');
          },
        } : undefined,
      });
    }
  }
}

export class AuthenticationErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error instanceof AuthenticationError;
  }

  handle(error: AuthenticationError): void {
    const message = error.userMessage || ERROR_MESSAGES[error.code];
    
    toast.error(message, {
      duration: 5000,
      action: {
        label: 'Sign In',
        onClick: () => {
          window.location.href = '/auth/signin';
        },
      },
    });
  }
}

export class NetworkErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error instanceof NetworkError;
  }

  handle(error: NetworkError): void {
    const message = error.userMessage || ERROR_MESSAGES[error.code];
    
    toast.error(message, {
      duration: 4000,
      action: error.retryable ? {
        label: 'Retry',
        onClick: () => {
          console.log('Retry network operation');
        },
      } : undefined,
    });
  }
}

// Register default handlers
globalErrorHandler.addHandler(new ValidationErrorHandler());
globalErrorHandler.addHandler(new FileProcessingErrorHandler());
globalErrorHandler.addHandler(new AIServiceErrorHandler());
globalErrorHandler.addHandler(new AuthenticationErrorHandler());
globalErrorHandler.addHandler(new NetworkErrorHandler());

// Utility functions for creating common errors
export const createValidationError = (message: string, field?: string) => 
  new ValidationError(message, field);

export const createFileProcessingError = (code: ErrorCode, message: string, fileName?: string) =>
  new FileProcessingError(code, message, fileName);

export const createAIServiceError = (code: ErrorCode, message: string, provider?: string) =>
  new AIServiceError(code, message, provider);

export const createAuthenticationError = (code: ErrorCode, message: string) =>
  new AuthenticationError(code, message);

export const createDatabaseError = (code: ErrorCode, message: string, table?: string) =>
  new DatabaseError(code, message, table);

export const createStorageError = (code: ErrorCode, message: string, bucket?: string) =>
  new StorageError(code, message, bucket);

export const createExportError = (code: ErrorCode, message: string, format?: string) =>
  new ExportError(code, message, format);

export const createNetworkError = (code: ErrorCode, message: string, url?: string) =>
  new NetworkError(code, message, url);

// Retry utilities
export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  retryCondition?: (error: Error) => boolean;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, delay, backoff = 'exponential', retryCondition } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      if (retryCondition && !retryCondition(lastError)) {
        throw lastError;
      }
      
      // Calculate delay
      let waitTime = delay;
      if (backoff === 'exponential') {
        waitTime = delay * Math.pow(2, attempt - 1);
      } else if (backoff === 'linear') {
        waitTime = delay * attempt;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
}

// Default retry condition for common retryable errors
export const defaultRetryCondition = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.retryable;
  }
  
  // Retry on network errors
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return true;
  }
  
  // Retry on timeout errors
  if (error.message.includes('timeout')) {
    return true;
  }
  
  return false;
};

// Error recovery utilities
export const createRecoveryAction = (
  label: string,
  action: () => void | Promise<void>,
  primary = false
): ErrorRecoveryAction => ({
  label,
  action,
  primary,
});

export const commonRecoveryActions = {
  retry: (retryFn: () => void | Promise<void>) => 
    createRecoveryAction('Retry', retryFn, true),
  
  goHome: () => 
    createRecoveryAction('Go Home', () => { window.location.href = '/'; }),
  
  refresh: () => 
    createRecoveryAction('Refresh Page', () => { window.location.reload(); }),
  
  signIn: () => 
    createRecoveryAction('Sign In', () => { window.location.href = '/auth/signin'; }),
  
  contactSupport: () => 
    createRecoveryAction('Contact Support', () => { 
      window.open('mailto:support@example.com', '_blank'); 
    }),
};