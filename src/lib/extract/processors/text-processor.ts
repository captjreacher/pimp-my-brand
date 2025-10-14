import { FileProcessor, ProcessingResult, FileProcessingError } from '../types';

export class TextProcessor implements FileProcessor {
  supportedTypes = [
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'text/html'
  ];

  canProcess(file: File): boolean {
    return this.supportedTypes.includes(file.type) || 
           file.name.endsWith('.txt') ||
           file.name.endsWith('.md') ||
           file.name.endsWith('.markdown') ||
           file.name.endsWith('.csv') ||
           file.name.endsWith('.json');
  }

  async extractText(file: File): Promise<string> {
    if (!this.canProcess(file)) {
      throw new FileProcessingError(
        `Unsupported file type: ${file.type}`,
        'UNSUPPORTED_TYPE',
        file
      );
    }

    try {
      const startTime = Date.now();
      const text = await file.text();
      
      if (!text || text.trim().length === 0) {
        throw new FileProcessingError(
          'File appears to be empty',
          'EMPTY_FILE',
          file
        );
      }

      // Basic text cleaning
      const cleanedText = this.cleanExtractedText(text);
      
      return cleanedText;
    } catch (error) {
      if (error instanceof FileProcessingError) {
        throw error;
      }
      
      throw new FileProcessingError(
        `Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'READ_FAILED',
        file
      );
    }
  }

  async extractWithMetadata(file: File): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      const text = await this.extractText(file);
      const processingTime = Date.now() - startTime;
      
      return {
        text,
        metadata: {
          wordCount: this.countWords(text),
          processingTime
        }
      };
    } catch (error) {
      throw error; // Re-throw as it's already a FileProcessingError
    }
  }

  private cleanExtractedText(text: string): string {
    // For plain text, we want to preserve most formatting
    // but normalize line endings and remove excessive whitespace
    return text
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove trailing whitespace from lines
      .replace(/[ \t]+$/gm, '')
      // Limit consecutive empty lines to 2
      .replace(/\n{4,}/g, '\n\n\n')
      // Trim overall
      .trim();
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}