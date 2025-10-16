// Custom error types for the application
export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // File processing errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  FILE_PROCESSING_FAILED = 'FILE_PROCESSING_FAILED',
  TEXT_EXTRACTION_FAILED = 'TEXT_EXTRACTION_FAILED',
  OCR_PROCESSING_FAILED = 'OCR_PROCESSING_FAILED',
  
  // AI service errors
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  AI_RATE_LIMIT_EXCEEDED = 'AI_RATE_LIMIT_EXCEEDED',
  AI_ANALYSIS_FAILED = 'AI_ANALYSIS_FAILED',
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
  AI_INVALID_RESPONSE = 'AI_INVALID_RESPONSE',
  
  // Authentication errors
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Database errors
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  DATABASE_CONSTRAINT_VIOLATION = 'DATABASE_CONSTRAINT_VIOLATION',
  
  // Storage errors
  STORAGE_UPLOAD_FAILED = 'STORAGE_UPLOAD_FAILED',
  STORAGE_DOWNLOAD_FAILED = 'STORAGE_DOWNLOAD_FAILED',
  STORAGE_DELETE_FAILED = 'STORAGE_DELETE_FAILED',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  
  // Export errors
  PDF_GENERATION_FAILED = 'PDF_GENERATION_FAILED',
  PNG_GENERATION_FAILED = 'PNG_GENERATION_FAILED',
  EXPORT_PROCESSING_FAILED = 'EXPORT_PROCESSING_FAILED',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

// Base application error class
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly recoveryActions?: ErrorRecoveryAction[];
  public readonly userMessage?: string;
  public readonly timestamp: Date;
  public readonly retryable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options: {
      severity?: ErrorSeverity;
      context?: ErrorContext;
      recoveryActions?: ErrorRecoveryAction[];
      userMessage?: string;
      retryable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.context = options.context;
    this.recoveryActions = options.recoveryActions;
    this.userMessage = options.userMessage;
    this.timestamp = new Date();
    this.retryable = options.retryable || false;

    if (options.cause) {
      this.cause = options.cause;
    }

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      context: this.context,
      userMessage: this.userMessage,
      timestamp: this.timestamp.toISOString(),
      retryable: this.retryable,
      stack: this.stack,
    };
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(
    message: string,
    field?: string,
    options: Omit<ConstructorParameters<typeof AppError>[2], 'severity'> = {}
  ) {
    super(ErrorCode.VALIDATION_ERROR, message, {
      ...options,
      severity: ErrorSeverity.LOW,
      context: {
        ...options.context,
        field,
      },
    });
    this.name = 'ValidationError';
  }
}

export class FileProcessingError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    fileName?: string,
    options: Omit<ConstructorParameters<typeof AppError>[2], 'severity'> = {}
  ) {
    super(code, message, {
      ...options,
      severity: ErrorSeverity.MEDIUM,
      context: {
        ...options.context,
        fileName,
      },
    });
    this.name = 'FileProcessingError';
  }
}

export class AIServiceError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    provider?: string,
    options: Omit<ConstructorParameters<typeof AppError>[2], 'severity'> = {}
  ) {
    super(code, message, {
      ...options,
      severity: ErrorSeverity.HIGH,
      retryable: code === ErrorCode.AI_RATE_LIMIT_EXCEEDED || code === ErrorCode.AI_SERVICE_UNAVAILABLE,
      context: {
        ...options.context,
        provider,
      },
    });
    this.name = 'AIServiceError';
  }
}

export class AuthenticationError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    options: Omit<ConstructorParameters<typeof AppError>[2], 'severity'> = {}
  ) {
    super(code, message, {
      ...options,
      severity: ErrorSeverity.HIGH,
      userMessage: 'Please sign in to continue',
    });
    this.name = 'AuthenticationError';
  }
}

export class DatabaseError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    table?: string,
    options: Omit<ConstructorParameters<typeof AppError>[2], 'severity'> = {}
  ) {
    super(code, message, {
      ...options,
      severity: ErrorSeverity.HIGH,
      context: {
        ...options.context,
        table,
      },
    });
    this.name = 'DatabaseError';
  }
}

export class StorageError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    bucket?: string,
    options: Omit<ConstructorParameters<typeof AppError>[2], 'severity'> = {}
  ) {
    super(code, message, {
      ...options,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      context: {
        ...options.context,
        bucket,
      },
    });
    this.name = 'StorageError';
  }
}

export class ExportError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    format?: string,
    options: Omit<ConstructorParameters<typeof AppError>[2], 'severity'> = {}
  ) {
    super(code, message, {
      ...options,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      context: {
        ...options.context,
        format,
      },
    });
    this.name = 'ExportError';
  }
}

export class NetworkError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    url?: string,
    options: Omit<ConstructorParameters<typeof AppError>[2], 'severity'> = {}
  ) {
    super(code, message, {
      ...options,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      context: {
        ...options.context,
        url,
      },
    });
    this.name = 'NetworkError';
  }
}