import mammoth from 'mammoth';
import { FileProcessor, ProcessingResult, FileProcessingError } from '../types';

export class DOCXProcessor implements FileProcessor {
  supportedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

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
      
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new FileProcessingError(
          'No text content found in document',
          'NO_TEXT_CONTENT',
          file
        );
      }

      // Log any warnings from mammoth
      if (result.messages && result.messages.length > 0) {
        console.warn('DOCX processing warnings:', result.messages);
      }

      const cleanedText = this.cleanExtractedText(result.value);
      
      return cleanedText;
    } catch (error) {
      if (error instanceof FileProcessingError) {
        throw error;
      }
      
      throw new FileProcessingError(
        `Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXTRACTION_FAILED',
        file
      );
    }
  }

  async extractWithMetadata(file: File): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract both raw text and HTML for better structure preservation
      const [textResult, htmlResult] = await Promise.all([
        mammoth.extractRawText({ arrayBuffer }),
        mammoth.convertToHtml({ arrayBuffer })
      ]);
      
      const processingTime = Date.now() - startTime;
      
      const cleanedText = this.cleanExtractedText(textResult.value);
      
      // Check for images in the HTML version
      const hasImages = htmlResult.value.includes('<img') || 
                       htmlResult.value.includes('[image:');
      
      return {
        text: cleanedText,
        metadata: {
          wordCount: this.countWords(cleanedText),
          hasImages,
          processingTime
        }
      };
    } catch (error) {
      throw new FileProcessingError(
        `Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXTRACTION_FAILED',
        file
      );
    }
  }

  async extractWithFormatting(file: File): Promise<{ text: string; html: string }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      const [textResult, htmlResult] = await Promise.all([
        mammoth.extractRawText({ arrayBuffer }),
        mammoth.convertToHtml({ 
          arrayBuffer
        })
      ]);
      
      return {
        text: this.cleanExtractedText(textResult.value),
        html: htmlResult.value
      };
    } catch (error) {
      throw new FileProcessingError(
        `Failed to extract formatted content from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXTRACTION_FAILED',
        file
      );
    }
  }

  private cleanExtractedText(text: string): string {
    return text
      // Normalize whitespace
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Clean up spacing
      .replace(/[ \t]+/g, ' ')
      // Remove trailing spaces on lines
      .replace(/[ \t]+$/gm, '')
      // Trim overall
      .trim();
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}