// Validation utility functions and helpers
import { z } from 'zod';

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Generic validation function
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      };
    }
    
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Validation failed with unknown error',
      }],
    };
  }
}

// Safe validation function that returns partial data
export function validateDataSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { data: Partial<T>; errors: ValidationError[] } {
  try {
    const result = schema.parse(data);
    return {
      data: result,
      errors: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Try to extract valid fields
      const validData: Partial<T> = {};
      const errors: ValidationError[] = [];
      
      // Get the original data as object
      const originalData = data as Record<string, unknown>;
      
      error.errors.forEach(err => {
        errors.push({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        });
      });
      
      // For simple cases, try to preserve valid fields
      if (typeof originalData === 'object' && originalData !== null) {
        Object.keys(originalData).forEach(key => {
          // Check if this field has validation errors
          const hasError = errors.some(err => err.field === key || err.field.startsWith(key + '.'));
          if (!hasError) {
            (validData as any)[key] = originalData[key];
          }
        });
      }
      
      return { data: validData, errors };
    }
    
    return {
      data: {},
      errors: [{
        field: 'unknown',
        message: 'Validation failed with unknown error',
      }],
    };
  }
}

// File validation utilities
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_DOCUMENT_SIZE: 25 * 1024 * 1024, // 25MB
} as const;

export const ALLOWED_FILE_TYPES = {
  DOCUMENTS: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
  ],
  IMAGES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  ALL: [] as string[], // Will be populated below
} as const;

// Populate ALL array
ALLOWED_FILE_TYPES.ALL = [
  ...ALLOWED_FILE_TYPES.DOCUMENTS,
  ...ALLOWED_FILE_TYPES.IMAGES,
];

export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  requireText?: boolean;
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): ValidationResult<File> {
  const {
    maxSize = FILE_SIZE_LIMITS.MAX_FILE_SIZE,
    allowedTypes = ALLOWED_FILE_TYPES.ALL,
    requireText = false,
  } = options;
  
  const errors: ValidationError[] = [];
  
  // Check file size
  if (file.size > maxSize) {
    errors.push({
      field: 'size',
      message: `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`,
      code: 'file_too_large',
    });
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push({
      field: 'type',
      message: `File type ${file.type} is not allowed`,
      code: 'invalid_file_type',
    });
  }
  
  // Check if file is empty
  if (file.size === 0) {
    errors.push({
      field: 'size',
      message: 'File cannot be empty',
      code: 'empty_file',
    });
  }
  
  // Additional validation for text requirement
  if (requireText && !ALLOWED_FILE_TYPES.DOCUMENTS.includes(file.type) && !ALLOWED_FILE_TYPES.IMAGES.includes(file.type)) {
    errors.push({
      field: 'type',
      message: 'File must be a document or image that can be processed for text',
      code: 'no_text_extractable',
    });
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }
  
  return {
    success: true,
    data: file,
  };
}

// Batch file validation
export function validateFiles(
  files: File[],
  options: FileValidationOptions = {}
): ValidationResult<File[]> {
  if (files.length === 0) {
    return {
      success: false,
      errors: [{
        field: 'files',
        message: 'At least one file is required',
        code: 'no_files',
      }],
    };
  }
  
  const allErrors: ValidationError[] = [];
  const validFiles: File[] = [];
  
  files.forEach((file, index) => {
    const result = validateFile(file, options);
    if (result.success && result.data) {
      validFiles.push(result.data);
    } else if (result.errors) {
      // Prefix errors with file index
      result.errors.forEach(error => {
        allErrors.push({
          ...error,
          field: `files[${index}].${error.field}`,
        });
      });
    }
  });
  
  if (allErrors.length > 0) {
    return {
      success: false,
      errors: allErrors,
    };
  }
  
  return {
    success: true,
    data: validFiles,
  };
}

// URL validation utilities
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}

// Text validation utilities
export function sanitizeText(text: string, maxLength?: number): string {
  // Remove potentially dangerous characters and normalize whitespace
  let sanitized = text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim();
  }
  
  return sanitized;
}

// Color validation utilities
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function normalizeHexColor(color: string): string {
  // Remove # if present and normalize case
  const cleaned = color.replace('#', '').toUpperCase();
  
  if (cleaned.length === 3) {
    // Convert 3-digit hex to 6-digit
    return `#${cleaned[0]}${cleaned[0]}${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}`;
  }
  
  if (cleaned.length === 6) {
    return `#${cleaned}`;
  }
  
  throw new Error('Invalid hex color format');
}

// Email validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Handle validation utilities
export function isValidHandle(handle: string): boolean {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(handle);
}

export function normalizeHandle(handle: string): string {
  return handle.toLowerCase().trim();
}

// Validation error formatting
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  
  if (errors.length === 1) {
    return errors[0].message;
  }
  
  return errors.map(error => `${error.field}: ${error.message}`).join('; ');
}

// Group validation errors by field
export function groupValidationErrors(errors: ValidationError[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  errors.forEach(error => {
    if (!grouped[error.field]) {
      grouped[error.field] = [];
    }
    grouped[error.field].push(error.message);
  });
  
  return grouped;
}

// Check if validation errors contain specific field
export function hasFieldError(errors: ValidationError[], field: string): boolean {
  return errors.some(error => error.field === field || error.field.startsWith(field + '.'));
}

// Get first error message for a field
export function getFieldError(errors: ValidationError[], field: string): string | undefined {
  const error = errors.find(error => error.field === field || error.field.startsWith(field + '.'));
  return error?.message;
}