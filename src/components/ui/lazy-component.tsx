import { Suspense, lazy, ComponentType } from "react";
import { LoadingSkeleton } from "./loading-skeleton";

interface LazyComponentProps {
  fallback?: React.ReactNode;
}

/**
 * Higher-order component for lazy loading with custom fallback
 */
export function withLazyLoading<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: T & LazyComponentProps) {
    return (
      <Suspense fallback={fallback || <LoadingSkeleton />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Lazy loading wrapper component
 */
export function LazyComponent({ 
  children, 
  fallback = <LoadingSkeleton /> 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}