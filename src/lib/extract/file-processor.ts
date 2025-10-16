import { FileProcessor, ProcessingResult, FileProcessingError, SUPPORTED_TEXT_TYPES } from './types';
import { PDFProcessor } from './processors/pdf-processor';
import { DOCXProcessor } from './processors/docx-processor';
import { TextProcessor } from './processors/text-processor';
import { OCRProcessor, OCROptions } from './processors/ocr-processor';

export class UnifiedFileProcessor {
  private processors: FileProcessor[];
  private ocrProcessor: OCRProcessor;

  constructor() {
    this.processors = [
      new PDFProcessor(),
      new DOCXProcessor(),
      new TextProcessor()
    ];
    this.ocrProcessor = new OCRProcessor();
  }

  /**
   * Get all supported file types across all processors
   */
  getSupportedTypes(): string[] {
    return [
      ...this.processors.flatMap(processor => processor.supportedTypes),
      ...this.ocrProcessor.supportedTypes
    ];
  }

  /**
   * Check if a file can be processed
   */
  canProcess(file: File, includeOCR: boolean = true): boolean {
    const canProcessWithStandardProcessors = this.processors.some(processor => processor.canProcess(file));
    const canProcessWithOCR = includeOCR && this.ocrProcessor.canProcess(file);
    return canProcessWithStandardProcessors || canProcessWithOCR;
  }

  /**
   * Get the appropriate processor for a file
   */
  private getProcessor(file: File, includeOCR: boolean = true): FileProcessor {
    const processor = this.processors.find(p => p.canProcess(file));
    
    if (processor) {
      return processor;
    }
    
    // Check if OCR can handle it
    if (includeOCR && this.ocrProcessor.canProcess(file)) {
      return this.ocrProcessor;
    }
    
    throw new FileProcessingError(
      `No processor available for file type: ${file.type}`,
      'NO_PROCESSOR',
      file
    );
  }

  /**
   * Extract text from a file using the appropriate processor
   */
  async extractText(file: File, ocrOptions?: OCROptions): Promise<string> {
    this.validateFile(file, ocrOptions?.enabled);
    
    const processor = this.getProcessor(file, ocrOptions?.enabled);
    
    try {
      // Handle OCR processor specially
      if (processor === this.ocrProcessor && ocrOptions) {
        return await this.ocrProcessor.extractText(file, ocrOptions);
      }
      
      return await processor.extractText(file);
    } catch (error) {
      // Add context about which processor failed
      if (error instanceof FileProcessingError) {
        error.message = `${processor.constructor.name}: ${error.message}`;
      }
      throw error;
    }
  }

  /**
   * Extract text with metadata from a file
   */
  async extractWithMetadata(file: File, ocrOptions?: OCROptions): Promise<ProcessingResult> {
    this.validateFile(file, ocrOptions?.enabled);
    
    const processor = this.getProcessor(file, ocrOptions?.enabled);
    
    // Check if processor supports metadata extraction
    if ('extractWithMetadata' in processor && typeof processor.extractWithMetadata === 'function') {
      try {
        // Handle OCR processor specially
        if (processor === this.ocrProcessor && ocrOptions) {
          return await this.ocrProcessor.extractWithMetadata(file, ocrOptions);
        }
        
        return await (processor as any).extractWithMetadata(file);
      } catch (error) {
        if (error instanceof FileProcessingError) {
          error.message = `${processor.constructor.name}: ${error.message}`;
        }
        throw error;
      }
    }
    
    // Fallback to basic extraction
    const startTime = Date.now();
    const text = await processor.extractText(file);
    const processingTime = Date.now() - startTime;
    
    return {
      text,
      metadata: {
        wordCount: this.countWords(text),
        processingTime
      }
    };
  }

  /**
   * Process multiple files concurrently
   */
  async extractFromMultipleFiles(files: File[]): Promise<Array<{ file: File; result?: ProcessingResult; error?: FileProcessingError }>> {
    const results = await Promise.allSettled(
      files.map(async (file) => {
        try {
          const result = await this.extractWithMetadata(file);
          return { file, result };
        } catch (error) {
          return { 
            file, 
            error: error instanceof FileProcessingError ? error : new FileProcessingError(
              `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              'UNEXPECTED_ERROR',
              file
            )
          };
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          file: files[index],
          error: new FileProcessingError(
            `Processing failed: ${result.reason}`,
            'PROCESSING_FAILED',
            files[index]
          )
        };
      }
    });
  }

  /**
   * Validate file before processing
   */
  private validateFile(file: File, includeOCR: boolean = true): void {
    if (!file) {
      throw new FileProcessingError('No file provided', 'NO_FILE');
    }

    if (file.size === 0) {
      throw new FileProcessingError('File is empty', 'EMPTY_FILE', file);
    }

    // Check file size limit (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new FileProcessingError(
        `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (50MB)`,
        'FILE_TOO_LARGE',
        file
      );
    }

    if (!this.canProcess(file, includeOCR)) {
      throw new FileProcessingError(
        `Unsupported file type: ${file.type}. Supported types: ${this.getSupportedTypes().join(', ')}`,
        'UNSUPPORTED_TYPE',
        file
      );
    }
  }

  /**
   * Utility method to count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get file type information
   */
  getFileTypeInfo(file: File): { type: string; processor: string; supported: boolean; requiresOCR?: boolean } {
    const standardProcessor = this.processors.find(p => p.canProcess(file));
    const canUseOCR = this.ocrProcessor.canProcess(file);
    
    if (standardProcessor) {
      return {
        type: file.type || 'unknown',
        processor: standardProcessor.constructor.name,
        supported: true
      };
    }
    
    if (canUseOCR) {
      return {
        type: file.type || 'unknown',
        processor: 'OCRProcessor',
        supported: true,
        requiresOCR: true
      };
    }
    
    return {
      type: file.type || 'unknown',
      processor: 'none',
      supported: false
    };
  }

  /**
   * Terminate OCR worker to free up resources
   */
  async terminateOCR(): Promise<void> {
    await this.ocrProcessor.terminate();
  }

  /**
   * Check if a file requires OCR processing
   */
  requiresOCR(file: File): boolean {
    return !this.processors.some(p => p.canProcess(file)) && this.ocrProcessor.canProcess(file);
  }
}

// Export a singleton instance
export const fileProcessor = new UnifiedFileProcessor();

// Export individual processors for direct use if needed
export { PDFProcessor, DOCXProcessor, TextProcessor, OCRProcessor };
export * from './types';
export type { OCROptions } from './processors/ocr-processor';