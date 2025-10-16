import * as React from "react";
import { cn } from "@/lib/utils";
import { LoadingState, Spinner } from "./loading-states";
import { AccessibleProgress } from "./accessible-progress";
import { X } from "lucide-react";
import { AccessibleButton } from "./accessible-button";
import { useFocusManagement } from "@/hooks/use-accessibility";

export interface LoadingOverlayProps {
  /** Whether overlay is visible */
  visible: boolean;
  /** Loading message */
  message?: string;
  /** Progress value (0-100) */
  progress?: number;
  /** Show progress bar */
  showProgress?: boolean;
  /** Allow cancellation */
  cancellable?: boolean;
  /** Cancel callback */
  onCancel?: () => void;
  /** Overlay variant */
  variant?: 'spinner' | 'progress' | 'skeleton';
  /** Blur background */
  blur?: boolean;
  /** Custom loading content */
  children?: React.ReactNode;
  className?: string;
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ 
    visible,
    message = "Loading...",
    progress = 0,
    showProgress = false,
    cancellable = false,
    onCancel,
    variant = 'spinner',
    blur = true,
    children,
    className,
    ...props 
  }, ref) => {
    const { containerRef, trapFocus, releaseFocus } = useFocusManagement();

    // Manage focus trapping when overlay is visible
    React.useEffect(() => {
      if (visible) {
        trapFocus();
      } else {
        releaseFocus();
      }
      
      return () => {
        releaseFocus();
      };
    }, [visible, trapFocus, releaseFocus]);

    // Prevent body scroll when overlay is visible
    React.useEffect(() => {
      if (visible) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      
      return () => {
        document.body.style.overflow = '';
      };
    }, [visible]);

    if (!visible) return null;

    return (
      <div 
        ref={containerRef}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          "bg-black/50",
          blur && "backdrop-blur-sm",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="loading-title"
        aria-describedby="loading-description"
        {...props}
      >
        <div className="bg-background rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
          {/* Header with cancel button */}
          <div className="flex items-center justify-between mb-4">
            <h2 id="loading-title" className="text-lg font-semibold">
              {message}
            </h2>
            {cancellable && onCancel && (
              <AccessibleButton
                variant="ghost"
                size="sm"
                onClick={onCancel}
                aria-label="Cancel loading"
                className="ml-2"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </AccessibleButton>
            )}
          </div>

          {/* Loading content */}
          <div id="loading-description" className="space-y-4">
            {children ? (
              children
            ) : (
              <>
                {variant === 'spinner' && (
                  <div className="flex justify-center">
                    <Spinner size="lg" />
                  </div>
                )}
                
                {variant === 'progress' && (
                  <AccessibleProgress
                    value={progress}
                    label={message}
                    showPercentage={showProgress}
                    size="md"
                  />
                )}
                
                {variant === 'skeleton' && (
                  <LoadingState
                    state="loading"
                    variant="skeleton"
                    message={message}
                  />
                )}
              </>
            )}
          </div>

          {/* Cancel button at bottom */}
          {cancellable && onCancel && (
            <div className="mt-6 flex justify-center">
              <AccessibleButton
                variant="outline"
                onClick={onCancel}
                className="min-w-[100px]"
              >
                Cancel
              </AccessibleButton>
            </div>
          )}
        </div>
      </div>
    );
  }
);

LoadingOverlay.displayName = "LoadingOverlay";

// Page loading overlay for route transitions
export interface PageLoadingOverlayProps {
  /** Whether page is loading */
  loading: boolean;
  /** Loading message */
  message?: string;
  /** Minimum display time (ms) to prevent flashing */
  minDisplayTime?: number;
}

const PageLoadingOverlay = React.forwardRef<HTMLDivElement, PageLoadingOverlayProps>(
  ({ loading, message = "Loading page...", minDisplayTime = 500 }, ref) => {
    const [shouldShow, setShouldShow] = React.useState(false);
    const [startTime, setStartTime] = React.useState<number | null>(null);

    React.useEffect(() => {
      if (loading) {
        setStartTime(Date.now());
        setShouldShow(true);
      } else if (startTime) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minDisplayTime - elapsed);
        
        setTimeout(() => {
          setShouldShow(false);
          setStartTime(null);
        }, remaining);
      }
    }, [loading, startTime, minDisplayTime]);

    return (
      <LoadingOverlay
        ref={ref}
        visible={shouldShow}
        message={message}
        variant="spinner"
        blur={false}
        className="bg-background/95"
      />
    );
  }
);

PageLoadingOverlay.displayName = "PageLoadingOverlay";

// Inline loading placeholder
export interface InlineLoadingProps {
  /** Loading state */
  loading: boolean;
  /** Loading message */
  message?: string;
  /** Content to show when not loading */
  children: React.ReactNode;
  /** Loading variant */
  variant?: 'spinner' | 'skeleton';
  /** Minimum height when loading */
  minHeight?: string;
  className?: string;
}

const InlineLoading = React.forwardRef<HTMLDivElement, InlineLoadingProps>(
  ({ 
    loading,
    message = "Loading...",
    children,
    variant = 'skeleton',
    minHeight = "200px",
    className,
    ...props 
  }, ref) => {
    if (loading) {
      return (
        <div 
          ref={ref}
          className={cn("flex items-center justify-center", className)}
          style={{ minHeight }}
          {...props}
        >
          <LoadingState
            state="loading"
            variant={variant}
            message={message}
            centered
          />
        </div>
      );
    }

    return <>{children}</>;
  }
);

InlineLoading.displayName = "InlineLoading";

export { LoadingOverlay, PageLoadingOverlay, InlineLoading };