// Main exports for file processing
export { extractText, extractTextWithMetadata, isFileSupported, getSupportedFileTypes, combineCorpus } from './text';
export { fileProcessor, UnifiedFileProcessor, PDFProcessor, DOCXProcessor, TextProcessor } from './file-processor';
export * from './types';

// Re-export processors for direct use
export { PDFProcessor } from './processors/pdf-processor';
export { DOCXProcessor } from './processors/docx-processor';
export { TextProcessor } from './processors/text-processor';