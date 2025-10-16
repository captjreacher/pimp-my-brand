import { FileProcessor, ProcessingResult, FileProcessingError, SUPPORTED_IMAGE_TYPES } from '../types';
import { createWorker, Worker } from 'tesseract.js';

export interface OCROptions {
  enabled: boolean;
  language?: string;
  preprocessImage?: boolean;
}

export class OCRProcessor implements FileProcessor {
  supportedTypes = [...SUPPORTED_IMAGE_TYPES];
  private worker: Worker | null = null;
  private isInitialized = false;

  canProcess(file: File): boolean {
    return this.supportedTypes.includes(file.type as any) || 
           file.name.match(/\.(png|jpe?g|webp)$/i) !== null;
  }

  async extractText(file: File, options: OCROptions = { enabled: true }): Promise<string> {
    if (!options.enabled) {
      return `[Image uploaded: ${file.name}. OCR disabled.]`;
    }

    if (!this.canProcess(file)) {
      throw new FileProcessingError(
        `Unsupported image type: ${file.type}`,
        'UNSUPPORTED_TYPE',
        file
      );
    }

    try {
      await this.initializeWorker(options.language);
      
      const { data: { text } } = await this.worker!.recognize(file);
      
      if (!text || text.trim().length === 0) {
        return `[Image processed: ${file.name}. No text detected.]`;
      }

      // Clean up the extracted text
      const cleanedText = this.cleanExtractedText(text);
      
      return cleanedText;
    } catch (error) {
      throw new FileProcessingError(
        `OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'OCR_FAILED',
        file
      );
    }
  }

  async extractWithMetadata(file: File, options: OCROptions = { enabled: true }): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      const text = await this.extractText(file, options);
      const processingTime = Date.now() - startTime;
      
      return {
        text,
        metadata: {
          wordCount: this.countWords(text),
          processingTime,
          hasImages: true
        }
      };
    } catch (error) {
      throw error; // Re-throw as it's already a FileProcessingError
    }
  }

  private async initializeWorker(language: string = 'eng'): Promise<void> {
    if (this.isInitialized && this.worker) {
      return;
    }

    try {
      this.worker = await createWorker(language);
      this.isInitialized = true;
    } catch (error) {
      throw new FileProcessingError(
        `Failed to initialize OCR worker: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'OCR_INIT_FAILED'
      );
    }
  }

  private cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove common OCR artifacts
      .replace(/[^\w\s\.,!?;:'"()-]/g, '')
      // Normalize line breaks
      .replace(/\n\s*\n/g, '\n\n')
      // Trim
      .trim();
  }

  private countWords(text: string): number {
    // Don't count words for placeholder messages
    if (text.startsWith('[Image') && text.endsWith(']')) {
      return 0;
    }
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Terminate the OCR worker to free up resources
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  /**
   * Get OCR progress (for future implementation)
   */
  onProgress(callback: (progress: number) => void): void {
    // Placeholder for progress tracking
    // Tesseract.js supports progress callbacks that could be implemented here
  }
}