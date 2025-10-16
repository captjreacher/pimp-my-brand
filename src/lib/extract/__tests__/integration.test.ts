import { describe, it, expect, vi } from 'vitest';
import { extractText, extractTextWithMetadata, isFileSupported, getSupportedFileTypes, requiresOCR } from '../text';

// Mock Tesseract.js for OCR tests
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => Promise.resolve({
    recognize: vi.fn(() => Promise.resolve({
      data: { text: 'OCR extracted text from image' }
    })),
    terminate: vi.fn(() => Promise.resolve())
  }))
}));

// Mock File with text() method for testing
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

const createMockFile = (content: string, name: string, type: string) => {
  return new MockFile([content], name, { type });
};

describe('Text Extraction Integration', () => {
  describe('extractText', () => {
    it('should extract text from supported file types', async () => {
      const textFile = createMockFile('Hello world', 'test.txt', 'text/plain');
      const result = await extractText(textFile);
      expect(result).toBe('Hello world');
    });

    it('should handle markdown files', async () => {
      const mdContent = '# Title\n\nThis is **bold** text.';
      const mdFile = createMockFile(mdContent, 'test.md', 'text/markdown');
      const result = await extractText(mdFile);
      expect(result).toBe(mdContent);
    });

    it('should return placeholder for unsupported files', async () => {
      const unsupportedFile = createMockFile('content', 'test.xyz', 'application/unknown');
      const result = await extractText(unsupportedFile);
      expect(result).toContain('[Unsupported file type: test.xyz]');
    });

    it('should extract text from images using OCR when enabled', async () => {
      const imageFile = createMockFile('fake image data', 'test.jpg', 'image/jpeg');
      const result = await extractText(imageFile, { enabled: true });
      expect(result).toBe('OCR extracted text from image');
    });

    it('should return placeholder for images when OCR is disabled', async () => {
      const imageFile = createMockFile('fake image data', 'test.jpg', 'image/jpeg');
      const result = await extractText(imageFile, { enabled: false });
      expect(result).toContain('[Unsupported file type: test.jpg]');
    });

    it('should handle processing errors gracefully', async () => {
      const emptyFile = createMockFile('', 'empty.txt', 'text/plain');
      const result = await extractText(emptyFile);
      expect(result).toContain('[Error processing empty.txt:');
    });
  });

  describe('extractTextWithMetadata', () => {
    it('should extract text with metadata for supported files', async () => {
      const content = 'This is a test document with several words.';
      const textFile = createMockFile(content, 'test.txt', 'text/plain');
      
      const result = await extractTextWithMetadata(textFile);
      
      expect(result.text).toBe(content);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.wordCount).toBe(8);
      expect(result.metadata?.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for unsupported files', async () => {
      const unsupportedFile = createMockFile('content', 'test.xyz', 'application/unknown');
      
      await expect(extractTextWithMetadata(unsupportedFile)).rejects.toThrow();
    });
  });

  describe('isFileSupported', () => {
    it('should return true for supported file types', () => {
      const textFile = createMockFile('content', 'test.txt', 'text/plain');
      expect(isFileSupported(textFile)).toBe(true);

      const mdFile = createMockFile('content', 'test.md', 'text/markdown');
      expect(isFileSupported(mdFile)).toBe(true);

      const pdfFile = createMockFile('content', 'test.pdf', 'application/pdf');
      expect(isFileSupported(pdfFile)).toBe(true);
    });

    it('should return true for image files when OCR is enabled', () => {
      const imageFile = createMockFile('content', 'test.png', 'image/png');
      expect(isFileSupported(imageFile, true)).toBe(true);
    });

    it('should return false for image files when OCR is disabled', () => {
      const imageFile = createMockFile('content', 'test.png', 'image/png');
      expect(isFileSupported(imageFile, false)).toBe(false);
    });

    it('should return false for unsupported file types', () => {
      const unsupportedFile = createMockFile('content', 'test.xyz', 'application/unknown');
      expect(isFileSupported(unsupportedFile)).toBe(false);
    });
  });

  describe('requiresOCR', () => {
    it('should return true for image files', () => {
      const imageFile = createMockFile('content', 'test.png', 'image/png');
      expect(requiresOCR(imageFile)).toBe(true);
    });

    it('should return false for text files', () => {
      const textFile = createMockFile('content', 'test.txt', 'text/plain');
      expect(requiresOCR(textFile)).toBe(false);
    });
  });

  describe('getSupportedFileTypes', () => {
    it('should return list of supported file types including images', () => {
      const types = getSupportedFileTypes();
      
      expect(types).toContain('text/plain');
      expect(types).toContain('text/markdown');
      expect(types).toContain('application/pdf');
      expect(types).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(types).toContain('image/png');
      expect(types).toContain('image/jpeg');
      expect(types.length).toBeGreaterThan(0);
    });
  });
});