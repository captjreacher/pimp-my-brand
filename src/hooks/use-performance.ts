import { useEffect, useRef } from "react";

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
}

export function usePerformanceMonitor(componentName: string) {
  const mountTimeRef = useRef<number>(Date.now());
  const renderStartRef = useRef<number>(Date.now());

  useEffect(() => {
    const mountTime = Date.now() - mountTimeRef.current;
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} mounted in ${mountTime}ms`);
    }

    return () => {
      const totalTime = Date.now() - mountTimeRef.current;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} total lifecycle: ${totalTime}ms`);
      }
    };
  }, [componentName]);

  const measureRender = () => {
    renderStartRef.current = Date.now();
  };

  const logRenderTime = () => {
    const renderTime = Date.now() - renderStartRef.current;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} render time: ${renderTime}ms`);
    }
  };

  return { measureRender, logRenderTime };
}

// Web Vitals monitoring
export function useWebVitals() {
  useEffect(() => {
    // Only load web-vitals in production
    if (process.env.NODE_ENV === 'production') {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
      }).catch(() => {
        // Silently fail if web-vitals is not available
      });
    }
  }, []);
}

// Bundle size monitoring
export function useBundleAnalysis() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Log initial bundle size
      const scripts = document.querySelectorAll('script[src]');
      let totalSize = 0;
      
      scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src && src.includes('assets')) {
          // Estimate size based on script tag (rough approximation)
          totalSize += 100; // KB estimate per script
        }
      });
      
      console.log(`[Bundle] Estimated initial bundle size: ~${totalSize}KB`);
    }
  }, []);
}