import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OCRProcessor } from '../processors/ocr-processor';
import { FileProcessingError } from '../types';

// Mock Tesseract.js
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => Promise.resolve({
    recognize: vi.fn(() => Promise.resolve({
      data: { text: 'Sample OCR text from image' }
    })),
    terminate: vi.fn(() => Promise.resolve())
  }))
}));

describe('OCRProcessor', () => {
  let processor: OCRProcessor;

  beforeEach(() => {
    processor = new OCRProcessor();
  });

  afterEach(async () => {
    await processor.terminate();
  });

  describe('canProcess', () => {
    it('should support image file types', () => {
      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const webpFile = new File([''], 'test.webp', { type: 'image/webp' });

      expect(processor.canProcess(pngFile)).toBe(true);
      expect(processor.canProcess(jpegFile)).toBe(true);
      expect(processor.canProcess(webpFile)).toBe(true);
    });

    it('should not support non-image file types', () => {
      const textFile = new File([''], 'test.txt', { type: 'text/plain' });
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });

      expect(processor.canProcess(textFile)).toBe(false);
      expect(processor.canProcess(pdfFile)).toBe(false);
    });

    it('should support image files by extension even without proper MIME type', () => {
      const pngFile = new File([''], 'test.png', { type: '' });
      const jpgFile = new File([''], 'test.jpg', { type: '' });

      expect(processor.canProcess(pngFile)).toBe(true);
      expect(processor.canProcess(jpgFile)).toBe(true);
    });
  });

  describe('extractText', () => {
    it('should extract text from image when OCR is enabled', async () => {
      const imageFile = new File(['fake-image-data'], 'test.png', { type: 'image/png' });
      
      const result = await processor.extractText(imageFile, { enabled: true });
      
      expect(result).toBe('Sample OCR text from image');
    });

    it('should return placeholder when OCR is disabled', async () => {
      const imageFile = new File(['fake-image-data'], 'test.png', { type: 'image/png' });
      
      const result = await processor.extractText(imageFile, { enabled: false });
      
      expect(result).toBe('[Image uploaded: test.png. OCR disabled.]');
    });

    it('should throw error for unsupported file types', async () => {
      const textFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
      
      await expect(processor.extractText(textFile, { enabled: true }))
        .rejects.toThrow(FileProcessingError);
    });

    it('should handle empty OCR results', async () => {
      const { createWorker } = await import('tesseract.js');
      vi.mocked(createWorker).mockResolvedValueOnce({
        recognize: vi.fn(() => Promise.resolve({ data: { text: '' } })),
        terminate: vi.fn(() => Promise.resolve())
      } as any);

      const imageFile = new File(['fake-image-data'], 'test.png', { type: 'image/png' });
      
      const result = await processor.extractText(imageFile, { enabled: true });
      
      expect(result).toBe('[Image processed: test.png. No text detected.]');
    });
  });

  describe('extractWithMetadata', () => {
    it('should return text with metadata', async () => {
      const imageFile = new File(['fake-image-data'], 'test.png', { type: 'image/png' });
      
      const result = await processor.extractWithMetadata(imageFile, { enabled: true });
      
      expect(result).toEqual({
        text: 'Sample OCR text from image',
        metadata: {
          wordCount: 5,
          processingTime: expect.any(Number),
          hasImages: true
        }
      });
    });

    it('should not count words for placeholder messages', async () => {
      const imageFile = new File(['fake-image-data'], 'test.png', { type: 'image/png' });
      
      const result = await processor.extractWithMetadata(imageFile, { enabled: false });
      
      expect(result.metadata?.wordCount).toBe(0);
    });
  });

  describe('supportedTypes', () => {
    it('should include all supported image types', () => {
      expect(processor.supportedTypes).toContain('image/png');
      expect(processor.supportedTypes).toContain('image/jpeg');
      expect(processor.supportedTypes).toContain('image/jpg');
      expect(processor.supportedTypes).toContain('image/webp');
    });
  });
});