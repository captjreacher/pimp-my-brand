/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Custom domain on GitHub Pages is served from root
  base: '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build for better performance
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          'query-vendor': ['@tanstack/react-query'],
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Feature chunks
          'ai-features': ['src/lib/ai/visual-analyzer.ts', 'src/lib/ai/visual-utils.ts'],
          'file-processing': ['src/lib/extract/file-processor.ts', 'pdf-parse', 'mammoth', 'tesseract.js'],
          'export-features': ['src/lib/export/pdf-exporter.ts', 'src/lib/export/png-exporter.ts', 'jspdf', 'html2canvas'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps in development only
    sourcemap: mode === 'development',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
    exclude: [
      // Exclude heavy libraries from pre-bundling to allow lazy loading
      'pdf-parse',
      'mammoth',
      'tesseract.js',
      'jspdf',
      'html2canvas',
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
}));
