import { beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock environment variables for testing
beforeAll(() => {
  // Mock Supabase environment variables
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  
  // Mock OpenAI API key
  process.env.VITE_OPENAI_API_KEY = 'test-openai-key';
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock global objects that might not be available in test environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock File and FileReader for file upload tests
global.File = class File {
  constructor(
    public chunks: BlobPart[],
    public name: string,
    public options?: FilePropertyBag
  ) {}
  
  get size() { return 1024; }
  get type() { return this.options?.type || 'text/plain'; }
  get lastModified() { return Date.now(); }
  
  text() { return Promise.resolve('Mock file content'); }
  arrayBuffer() { return Promise.resolve(new ArrayBuffer(1024)); }
  slice() { return new Blob(); }
  stream() { return new ReadableStream(); }
};

global.FileReader = class FileReader extends EventTarget {
  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;
  readyState: number = 0;
  
  readAsText() {
    setTimeout(() => {
      this.result = 'Mock file content';
      this.readyState = 2;
      this.dispatchEvent(new Event('load'));
    }, 0);
  }
  
  readAsArrayBuffer() {
    setTimeout(() => {
      this.result = new ArrayBuffer(1024);
      this.readyState = 2;
      this.dispatchEvent(new Event('load'));
    }, 0);
  }
  
  abort() {}
};