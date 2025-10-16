import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnifiedFileProcessor, FileProcessingError } from '../file-processor';
import { TextProcessor } from '../processors/text-processor';

// Mock File with text() method
class MockFile extends File {
  private content: string;
  
  constructor(content: string[], name: string, options?: FilePropertyBag) {
    super(content, name, options);
    this.content = content.join('');
  }
  
  async text(): Promise<string> {
    return this.content;
  }
}

// Replace File constructor in tests
const createMockFile = (content: string, name: string, type: string) => {
  return new MockFile([content], name, { type });
};

describe('UnifiedFileProcessor', () => {
  let processor: UnifiedFileProcessor;

  beforeEach(() => {
    processor = new UnifiedFileProcessor();
  });

  describe('getSupportedTypes', () => {
    it('should return all supported file types', () => {
      const types = processor.getSupportedTypes();
      
      expect(types).toContain('text/plain');
      expect(types).toContain('text/markdown');
      expect(types).toContain('application/pdf');
      expect(types).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(types.length).toBeGreaterThan(0);
    });
  });

  describe('canProcess', () => {
    it('should return true for supported text files', () => {
      const textFile = createMockFile('test content', 'test.txt', 'text/plain');
      expect(processor.canProcess(textFile)).toBe(true);
    });

    it('should return true for markdown files', () => {
      const mdFile = createMockFile('# Test', 'test.md', 'text/markdown');
      expect(processor.canProcess(mdFile)).toBe(true);
    });

    it('should return true for PDF files', () => {
      const pdfFile = createMockFile('fake pdf content', 'test.pdf', 'application/pdf');
      expect(processor.canProcess(pdfFile)).toBe(true);
    });

    it('should return false for unsupported files', () => {
      const unsupportedFile = createMockFile('test', 'test.xyz', 'application/unknown');
      expect(processor.canProcess(unsupportedFile)).toBe(false);
    });
  });

  describe('extractText', () => {
    it('should extract text from plain text files', async () => {
      const content = 'This is test content for extraction.';
      const textFile = createMockFile(content, 'test.txt', 'text/plain');
      
      const result = await processor.extractText(textFile);
      expect(result).toBe(content);
    });

    it('should extract text from markdown files', async () => {
      const content = '# Test Heading\n\nThis is markdown content.';
      const mdFile = createMockFile(content, 'test.md', 'text/markdown');
      
      const result = await processor.extractText(mdFile);
      expect(result).toBe(content);
    });

    it('should throw error for unsupported files', async () => {
      const unsupportedFile = createMockFile('test', 'test.xyz', 'application/unknown');
      
      await expect(processor.extractText(unsupportedFile)).rejects.toThrow(FileProcessingError);
    });

    it('should throw error for empty files', async () => {
      const emptyFile = createMockFile('', 'empty.txt', 'text/plain');
      
      await expect(processor.extractText(emptyFile)).rejects.toThrow(FileProcessingError);
    });

    it('should throw error for files that are too large', async () => {
      // Create a mock file that reports a large size
      const largeFile = createMockFile('content', 'large.txt', 'text/plain');
      Object.defineProperty(largeFile, 'size', { value: 60 * 1024 * 1024 }); // 60MB
      
      await expect(processor.extractText(largeFile)).rejects.toThrow(FileProcessingError);
    });
  });

  describe('extractWithMetadata', () => {
    it('should extract text with metadata for text files', async () => {
      const content = 'This is test content with multiple words for counting.';
      const textFile = createMockFile(content, 'test.txt', 'text/plain');
      
      const result = await processor.extractWithMetadata(textFile);
      
      expect(result.text).toBe(content);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.wordCount).toBe(9);
      expect(result.metadata?.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('extractFromMultipleFiles', () => {
    it('should process multiple files successfully', async () => {
      const files = [
        createMockFile('First file content', 'file1.txt', 'text/plain'),
        createMockFile('Second file content', 'file2.txt', 'text/plain')
      ];
      
      const results = await processor.extractFromMultipleFiles(files);
      
      expect(results).toHaveLength(2);
      expect(results[0].result?.text).toBe('First file content');
      expect(results[1].result?.text).toBe('Second file content');
      expect(results[0].error).toBeUndefined();
      expect(results[1].error).toBeUndefined();
    });

    it('should handle mixed success and failure', async () => {
      const files = [
        createMockFile('Valid content', 'valid.txt', 'text/plain'),
        createMockFile('', 'invalid.xyz', 'application/unknown')
      ];
      
      const results = await processor.extractFromMultipleFiles(files);
      
      expect(results).toHaveLength(2);
      expect(results[0].result?.text).toBe('Valid content');
      expect(results[0].error).toBeUndefined();
      expect(results[1].result).toBeUndefined();
      expect(results[1].error).toBeInstanceOf(FileProcessingError);
    });
  });

  describe('getFileTypeInfo', () => {
    it('should return correct info for supported files', () => {
      const textFile = createMockFile('content', 'test.txt', 'text/plain');
      const info = processor.getFileTypeInfo(textFile);
      
      expect(info.type).toBe('text/plain');
      expect(info.processor).toBe('TextProcessor');
      expect(info.supported).toBe(true);
    });

    it('should return correct info for unsupported files', () => {
      const unsupportedFile = createMockFile('content', 'test.xyz', 'application/unknown');
      const info = processor.getFileTypeInfo(unsupportedFile);
      
      expect(info.type).toBe('application/unknown');
      expect(info.processor).toBe('none');
      expect(info.supported).toBe(false);
    });
  });
});

describe('TextProcessor', () => {
  let processor: TextProcessor;

  beforeEach(() => {
    processor = new TextProcessor();
  });

  describe('canProcess', () => {
    it('should handle files by extension when MIME type is missing', () => {
      const txtFile = createMockFile('content', 'test.txt', '');
      expect(processor.canProcess(txtFile)).toBe(true);
      
      const mdFile = createMockFile('content', 'test.md', '');
      expect(processor.canProcess(mdFile)).toBe(true);
      
      const unknownFile = createMockFile('content', 'test.xyz', '');
      expect(processor.canProcess(unknownFile)).toBe(false);
    });
  });

  describe('extractText', () => {
    it('should clean up text formatting', async () => {
      const messyContent = 'Line 1\r\nLine 2\r\n\n\n\nLine 3   \n  Line 4  ';
      const textFile = createMockFile(messyContent, 'test.txt', 'text/plain');
      
      const result = await processor.extractText(textFile);
      
      // Should normalize line endings and clean up excessive whitespace
      expect(result).not.toContain('\r');
      expect(result).not.toMatch(/\n{4,}/);
      expect(result).not.toMatch(/[ \t]+$/m);
    });
  });
});