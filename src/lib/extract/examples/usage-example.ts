// Example usage of the enhanced file processing system

import { fileProcessor, extractText, extractTextWithMetadata, isFileSupported } from '../index';

/**
 * Example: Basic text extraction from different file types
 */
export async function basicTextExtraction(file: File): Promise<string> {
  try {
    // Check if file is supported
    if (!isFileSupported(file)) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    // Extract text using the simple interface
    const text = await extractText(file);
    return text;
  } catch (error) {
    console.error('Text extraction failed:', error);
    throw error;
  }
}

/**
 * Example: Advanced text extraction with metadata
 */
export async function advancedTextExtraction(file: File) {
  try {
    const result = await extractTextWithMetadata(file);
    
    return {
      text: result.text,
      wordCount: result.metadata?.wordCount || 0,
      processingTime: result.metadata?.processingTime || 0,
      hasImages: result.metadata?.hasImages || false,
      pageCount: result.metadata?.pageCount
    };
  } catch (error) {
    console.error('Advanced text extraction failed:', error);
    throw error;
  }
}

/**
 * Example: Batch processing multiple files
 */
export async function batchProcessFiles(files: File[]) {
  const results = await fileProcessor.extractFromMultipleFiles(files);
  
  const successful: Array<{ file: File; text: string; wordCount: number }> = [];
  const failed: Array<{ file: File; error: string }> = [];
  
  results.forEach(result => {
    if (result.result) {
      successful.push({
        file: result.file,
        text: result.result.text,
        wordCount: result.result.metadata?.wordCount || 0
      });
    } else if (result.error) {
      failed.push({
        file: result.file,
        error: result.error.message
      });
    }
  });
  
  return { successful, failed };
}

/**
 * Example: File type validation and info
 */
export function getFileProcessingInfo(file: File) {
  const info = fileProcessor.getFileTypeInfo(file);
  const supportedTypes = fileProcessor.getSupportedTypes();
  
  return {
    fileName: file.name,
    fileSize: file.size,
    mimeType: info.type,
    processor: info.processor,
    isSupported: info.supported,
    allSupportedTypes: supportedTypes
  };
}

/**
 * Example: Error handling patterns
 */
export async function robustTextExtraction(file: File) {
  try {
    // Validate file first
    const info = getFileProcessingInfo(file);
    if (!info.isSupported) {
      return {
        success: false,
        error: `File type ${info.mimeType} is not supported. Supported types: ${info.allSupportedTypes.join(', ')}`,
        text: null
      };
    }

    // Check file size (example: 10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size exceeds 10MB limit',
        text: null
      };
    }

    // Extract text
    const result = await extractTextWithMetadata(file);
    
    return {
      success: true,
      error: null,
      text: result.text,
      metadata: result.metadata
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      text: null
    };
  }
}