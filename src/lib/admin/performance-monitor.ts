import { adminAnalyticsService } from './analytics-service';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private isEnabled = true;
  private sampleRate = 0.1; // Sample 10% of requests by default

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Set the sampling rate for performance monitoring
   */
  setSampleRate(rate: number): void {
    this.sampleRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Monitor a fetch request
   */
  async monitorFetch(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    if (!this.isEnabled || Math.random() > this.sampleRate) {
      return fetch(url, options);
    }

    const startTime = performance.now();
    const endpoint = this.extractEndpoint(url);
    
    try {
      const response = await fetch(url, options);
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Record the metric asynchronously
      this.recordMetric(endpoint, responseTime, response.status);

      return response;
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Record error metric
      this.recordMetric(
        endpoint, 
        responseTime, 
        0, 
        error instanceof Error ? error.message : 'Network error'
      );

      throw error;
    }
  }

  /**
   * Monitor an API route handler
   */
  monitorApiRoute<T>(
    routeName: string,
    handler: () => Promise<T>
  ): Promise<T> {
    if (!this.isEnabled || Math.random() > this.sampleRate) {
      return handler();
    }

    const startTime = performance.now();

    return handler()
      .then((result) => {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        this.recordMetric(`/api/${routeName}`, responseTime, 200);
        return result;
      })
      .catch((error) => {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        const statusCode = error.status || 500;
        const errorMessage = error.message || 'Internal server error';
        
        this.recordMetric(
          `/api/${routeName}`, 
          responseTime, 
          statusCode, 
          errorMessage
        );
        
        throw error;
      });
  }

  /**
   * Monitor a database query
   */
  async monitorQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    if (!this.isEnabled || Math.random() > this.sampleRate) {
      return queryFn();
    }

    const startTime = performance.now();

    try {
      const result = await queryFn();
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      this.recordMetric(`db:${queryName}`, responseTime, 200);
      return result;
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      this.recordMetric(
        `db:${queryName}`, 
        responseTime, 
        500, 
        error instanceof Error ? error.message : 'Database error'
      );
      
      throw error;
    }
  }

  /**
   * Record a custom performance metric
   */
  recordCustomMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    // Store custom metrics in a different way if needed
    console.debug(`Custom metric: ${name} = ${value}${unit}`, metadata);
  }

  /**
   * Start monitoring page load performance
   */
  monitorPageLoad(pageName: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = Math.round(endTime - startTime);
      this.recordMetric(`page:${pageName}`, loadTime, 200);
    };
  }

  /**
   * Monitor component render performance
   */
  monitorComponentRender(componentName: string): {
    start: () => void;
    end: () => void;
  } {
    if (!this.isEnabled) {
      return { start: () => {}, end: () => {} };
    }

    let startTime: number;

    return {
      start: () => {
        startTime = performance.now();
      },
      end: () => {
        if (startTime) {
          const endTime = performance.now();
          const renderTime = Math.round(endTime - startTime);
          this.recordMetric(`component:${componentName}`, renderTime, 200);
        }
      }
    };
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): {
    memory?: MemoryInfo;
    navigation?: PerformanceNavigationTiming;
    connection?: any;
  } {
    const metrics: any = {};

    // Memory usage (if available)
    if ('memory' in performance) {
      metrics.memory = (performance as any).memory;
    }

    // Navigation timing
    if (performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        metrics.navigation = navEntries[0] as PerformanceNavigationTiming;
      }
    }

    // Network connection info (if available)
    if ('connection' in navigator) {
      metrics.connection = (navigator as any).connection;
    }

    return metrics;
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  }

  // Private methods

  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  private recordMetric(
    endpoint: string,
    responseTime: number,
    statusCode: number,
    errorMessage?: string
  ): void {
    // Record asynchronously to avoid blocking the main thread
    setTimeout(() => {
      adminAnalyticsService.recordHealthMetric(
        endpoint,
        responseTime,
        statusCode,
        errorMessage,
        navigator.userAgent,
        // IP address would be determined server-side
        undefined
      ).catch(error => {
        console.warn('Failed to record performance metric:', error);
      });
    }, 0);
  }
}

// Create a singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility function to wrap fetch with monitoring
export const monitoredFetch = (url: string, options?: RequestInit): Promise<Response> => {
  return performanceMonitor.monitorFetch(url, options);
};

// React hook for monitoring component performance
export const usePerformanceMonitor = (componentName: string) => {
  const monitor = performanceMonitor.monitorComponentRender(componentName);
  
  return {
    startRender: monitor.start,
    endRender: monitor.end,
    recordCustomMetric: (name: string, value: number, unit?: string) => {
      performanceMonitor.recordCustomMetric(`${componentName}:${name}`, value, unit);
    }
  };
};