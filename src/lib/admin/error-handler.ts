/**
 * Unified Admin Error Handler
 * Provides consistent error handling across all admin operations
 */

export interface AdminError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export class AdminErrorHandler {
  private static instance: AdminErrorHandler;

  static getInstance(): AdminErrorHandler {
    if (!AdminErrorHandler.instance) {
      AdminErrorHandler.instance = new AdminErrorHandler();
    }
    return AdminErrorHandler.instance;
  }

  /**
   * Handle database connection errors
   */
  handleDatabaseError(error: any): AdminError {
    console.error('Database error:', error);
    
    return {
      code: 'DATABASE_ERROR',
      message: 'Failed to connect to database. Please try again.',
      details: error,
      timestamp: new Date()
    };
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: any): AdminError {
    console.error('Authentication error:', error);
    
    return {
      code: 'AUTH_ERROR',
      message: 'Authentication failed. Please check your permissions.',
      details: error,
      timestamp: new Date()
    };
  }

  /**
   * Handle permission errors
   */
  handlePermissionError(error: any): AdminError {
    console.error('Permission error:', error);
    
    return {
      code: 'PERMISSION_ERROR',
      message: 'Insufficient permissions for this operation.',
      details: error,
      timestamp: new Date()
    };
  }

  /**
   * Handle general service errors
   */
  handleServiceError(error: any, operation: string): AdminError {
    console.error(`Service error in ${operation}:`, error);
    
    return {
      code: 'SERVICE_ERROR',
      message: `Failed to ${operation}. Please try again.`,
      details: error,
      timestamp: new Date()
    };
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error: any): AdminError {
    console.error('Network error:', error);
    
    return {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed. Please check your internet connection.',
      details: error,
      timestamp: new Date()
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: AdminError): string {
    switch (error.code) {
      case 'DATABASE_ERROR':
        return 'Unable to load data. Please refresh the page or try again later.';
      case 'AUTH_ERROR':
        return 'Session expired. Please log in again.';
      case 'PERMISSION_ERROR':
        return 'You don\'t have permission to perform this action.';
      case 'NETWORK_ERROR':
        return 'Connection lost. Please check your internet connection.';
      case 'SERVICE_ERROR':
        return 'Service temporarily unavailable. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Log error for monitoring
   */
  logError(error: AdminError, context?: any): void {
    const logEntry = {
      ...error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In production, this would send to monitoring service
    console.error('Admin Error Log:', logEntry);
  }
}

export const adminErrorHandler = AdminErrorHandler.getInstance();