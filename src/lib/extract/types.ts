// File processing types and interfaces

export interface FileProcessor {
  extractText(file: File): Promise<string>;
  supportedTypes: string[];
  canProcess(file: File): boolean;
}

export interface ProcessingResult {
  text: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    hasImages?: boolean;
    processingTime?: number;
  };
}

export interface ProcessingError extends Error {
  code: string;
  file?: File;
}

export class FileProcessingError extends Error implements ProcessingError {
  code: string;
  file?: File;

  constructor(message: string, code: string, file?: File) {
    super(message);
    this.name = 'FileProcessingError';
    this.code = code;
    this.file = file;
  }
}

// Supported file types
export const SUPPORTED_TEXT_TYPES = [
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
] as const;

export const SUPPORTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
] as const;

export type SupportedTextType = typeof SUPPORTED_TEXT_TYPES[number];
export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];