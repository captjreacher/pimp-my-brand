// Text extraction utilities for various file types
import { fileProcessor, FileProcessingError, OCROptions } from './file-processor';

export async function extractText(file: File, ocrOptions?: OCROptions): Promise<string> {
  try {
    // Use the unified file processor for all supported types
    if (fileProcessor.canProcess(file, ocrOptions?.enabled)) {
      return await fileProcessor.extractText(file, ocrOptions);
    }
    
    // Unsupported file type
    return `[Unsupported file type: ${file.name}]`;
  } catch (error) {
    if (error instanceof FileProcessingError) {
      console.error('File processing error:', error.message);
      return `[Error processing ${file.name}: ${error.message}]`;
    }
    
    console.error('Unexpected error during file processing:', error);
    return `[Error processing ${file.name}: Unexpected error occurred]`;
  }
}

export function combineCorpus(texts: string[]): string {
  return texts.filter(Boolean).join('\n\n---\n\n');
}
/**
 * Extract text with metadata from a file
 */
export async function extractTextWithMetadata(file: File, ocrOptions?: OCROptions) {
  try {
    if (fileProcessor.canProcess(file, ocrOptions?.enabled)) {
      return await fileProcessor.extractWithMetadata(file, ocrOptions);
    }
    
    throw new FileProcessingError(
      `Unsupported file type: ${file.type}`,
      'UNSUPPORTED_TYPE',
      file
    );
  } catch (error) {
    if (error instanceof FileProcessingError) {
      throw error;
    }
    
    throw new FileProcessingError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'UNEXPECTED_ERROR',
      file
    );
  }
}

/**
 * Check if a file type is supported for text extraction
 */
export function isFileSupported(file: File, includeOCR: boolean = true): boolean {
  return fileProcessor.canProcess(file, includeOCR);
}

/**
 * Check if a file requires OCR processing
 */
export function requiresOCR(file: File): boolean {
  return fileProcessor.requiresOCR(file);
}

/**
 * Get information about file processing capabilities
 */
export function getFileTypeInfo(file: File) {
  return fileProcessor.getFileTypeInfo(file);
}

/**
 * Get all supported file types
 */
export function getSupportedFileTypes(): string[] {
  return fileProcessor.getSupportedTypes();
}