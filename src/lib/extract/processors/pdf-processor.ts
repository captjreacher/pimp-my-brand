// @ts-ignore - pdf-parse has complex module exports
const pdfParse = require('pdf-parse');
import { FileProcessor, ProcessingResult, FileProcessingError } from '../types';

export class PDFProcessor implements FileProcessor {
  supportedTypes = ['application/pdf'];

  canProcess(file: File): boolean {
    return this.supportedTypes.includes(file.type);
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
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const data = await pdfParse(buffer, {
        // Options for better text extraction
        max: 0, // No page limit
        version: 'v1.10.100' // Use specific version for consistency
      });

      const processingTime = Date.now() - startTime;
      
      if (!data.text || data.text.trim().length === 0) {
        throw new FileProcessingError(
          'No text content found in PDF',
          'NO_TEXT_CONTENT',
          file
        );
      }

      // Clean up the extracted text
      const cleanedText = this.cleanExtractedText(data.text);
      
      return cleanedText;
    } catch (error) {
      if (error instanceof FileProcessingError) {
        throw error;
      }
      
      throw new FileProcessingError(
        `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXTRACTION_FAILED',
        file
      );
    }
  }

  async extractWithMetadata(file: File): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const data = await pdfParse(buffer);
      const processingTime = Date.now() - startTime;
      
      const cleanedText = this.cleanExtractedText(data.text);
      
      return {
        text: cleanedText,
        metadata: {
          pageCount: data.numpages,
          wordCount: this.countWords(cleanedText),
          hasImages: data.text.includes('[image]') || data.text.includes('[figure]'),
          processingTime
        }
      };
    } catch (error) {
      throw new FileProcessingError(
        `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXTRACTION_FAILED',
        file
      );
    }
  }

  private cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page breaks and form feeds
      .replace(/[\f\r]/g, '')
      // Clean up line breaks - preserve paragraph breaks but remove single line breaks
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/\n(?!\n)/g, ' ')
      // Remove common PDF artifacts
      .replace(/\s*\|\s*/g, ' ')
      .replace(/_{3,}/g, '')
      .replace(/-{3,}/g, '')
      // Trim and normalize
      .trim();
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}