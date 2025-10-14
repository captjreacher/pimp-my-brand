// Bundle analysis utilities for development
export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private loadTimes = new Map<string, number>();
  private chunkSizes = new Map<string, number>();

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  // Track chunk load times
  trackChunkLoad(chunkName: string, startTime: number): void {
    const loadTime = performance.now() - startTime;
    this.loadTimes.set(chunkName, loadTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Bundle] ${chunkName} loaded in ${loadTime.toFixed(2)}ms`);
    }
  }

  // Estimate chunk size (rough approximation)
  estimateChunkSize(chunkName: string, element?: HTMLElement): void {
    if (element && element.textContent) {
      const size = new Blob([element.textContent]).size;
      this.chunkSizes.set(chunkName, size);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Bundle] ${chunkName} estimated size: ${(size / 1024).toFixed(2)}KB`);
      }
    }
  }

  // Get performance report
  getPerformanceReport(): {
    loadTimes: Record<string, number>;
    chunkSizes: Record<string, number>;
    totalLoadTime: number;
    totalSize: number;
  } {
    const loadTimes = Object.fromEntries(this.loadTimes);
    const chunkSizes = Object.fromEntries(this.chunkSizes);
    
    const totalLoadTime = Array.from(this.loadTimes.values()).reduce((sum, time) => sum + time, 0);
    const totalSize = Array.from(this.chunkSizes.values()).reduce((sum, size) => sum + size, 0);

    return {
      loadTimes,
      chunkSizes,
      totalLoadTime,
      totalSize,
    };
  }

  // Log performance summary
  logSummary(): void {
    if (process.env.NODE_ENV === 'development') {
      const report = this.getPerformanceReport();
      console.group('[Bundle Performance Summary]');
      console.log('Total Load Time:', `${report.totalLoadTime.toFixed(2)}ms`);
      console.log('Total Estimated Size:', `${(report.totalSize / 1024).toFixed(2)}KB`);
      console.log('Chunk Load Times:', report.loadTimes);
      console.log('Chunk Sizes:', report.chunkSizes);
      console.groupEnd();
    }
  }
}

// Hook for tracking component load performance
export function useChunkLoadTracking(chunkName: string) {
  const analyzer = BundleAnalyzer.getInstance();
  const startTime = performance.now();

  return {
    trackLoad: () => analyzer.trackChunkLoad(chunkName, startTime),
    estimateSize: (element?: HTMLElement) => analyzer.estimateChunkSize(chunkName, element),
  };
}

// Performance observer for monitoring
export function initializePerformanceObserver(): void {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      // Monitor navigation timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Performance] ${entry.name}: ${entry.duration?.toFixed(2)}ms`);
          }
        });
      });
      
      navObserver.observe({ entryTypes: ['navigation', 'measure'] });

      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('chunk') && process.env.NODE_ENV === 'development') {
            console.log(`[Resource] ${entry.name}: ${entry.duration?.toFixed(2)}ms`);
          }
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }
  }
}