import * as React from "react";
import { cn } from "@/lib/utils";
import { LoadingSkeleton } from "./loading-skeleton";
import { AccessibleProgress } from "./accessible-progress";
import { Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useScreenReader } from "@/hooks/use-accessibility";

export interface LoadingStateProps {
  /** Loading state type */
  state: 'idle' | 'loading' | 'success' | 'error';
  /** Loading message */
  message?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Progress value (0-100) */
  progress?: number;
  /** Show progress bar */
  showProgress?: boolean;
  /** Loading variant */
  variant?: 'spinner' | 'skeleton' | 'progress' | 'dots';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Center the loading state */
  centered?: boolean;
  /** Custom loading content */
  children?: React.ReactNode;
  className?: string;
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ 
    state,
    message = "Loading...",
    error,
    success,
    progress = 0,
    showProgress = false,
    variant = 'spinner',
    size = 'md',
    centered = false,
    children,
    className,
    ...props 
  }, ref) => {
    const { announce } = useScreenReader();

    // Announce state changes
    React.useEffect(() => {
      if (state === 'loading' && message) {
        announce(message, 'polite');
      } else if (state === 'error' && error) {
        announce(`Error: ${error}`, 'assertive');
      } else if (state === 'success' && success) {
        announce(`Success: ${success}`, 'polite');
      }
    }, [state, message, error, success, announce]);

    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8'
    };

    if (state === 'idle') {
      return children ? <>{children}</> : null;
    }

    const renderLoadingContent = () => {
      switch (variant) {
        case 'skeleton':
          return (
            <LoadingSkeleton
              lines={3}
              avatar={size === 'lg'}
              button={size === 'lg'}
              speed="normal"
            />
          );

        case 'progress':
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className={cn("animate-spin", iconSizes[size])} aria-hidden="true" />
                <span className={sizeClasses[size]}>{message}</span>
              </div>
              {(showProgress || progress > 0) && (
                <AccessibleProgress
                  value={progress}
                  label={message}
                  showPercentage
                  size={size}
                />
              )}
            </div>
          );

        case 'dots':
          return (
            <div className="flex items-center gap-3">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "bg-primary rounded-full animate-pulse",
                      size === 'sm' && "w-2 h-2",
                      size === 'md' && "w-3 h-3",
                      size === 'lg' && "w-4 h-4"
                    )}
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '1.4s'
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className={sizeClasses[size]}>{message}</span>
            </div>
          );

        default: // spinner
          return (
            <div className="flex items-center gap-3">
              <Loader2 className={cn("animate-spin", iconSizes[size])} aria-hidden="true" />
              <span className={sizeClasses[size]}>{message}</span>
            </div>
          );
      }
    };

    const renderStateContent = () => {
      switch (state) {
        case 'loading':
          return renderLoadingContent();

        case 'error':
          return (
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className={cn("flex-shrink-0", iconSizes[size])} aria-hidden="true" />
              <span className={sizeClasses[size]}>{error || "An error occurred"}</span>
            </div>
          );

        case 'success':
          return (
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle2 className={cn("flex-shrink-0", iconSizes[size])} aria-hidden="true" />
              <span className={sizeClasses[size]}>{success || "Success!"}</span>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div 
        ref={ref}
        className={cn(
          "flex items-center",
          centered && "justify-center min-h-[200px]",
          !centered && "gap-2",
          className
        )}
        role={state === 'error' ? 'alert' : 'status'}
        aria-live={state === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
        {...props}
      >
        {renderStateContent()}
      </div>
    );
  }
);

LoadingState.displayName = "LoadingState";

// Specialized loading components
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8'
    };

    return (
      <div 
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <Loader2 className={cn("animate-spin", sizeClasses[size])} aria-hidden="true" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Spinner.displayName = "Spinner";

// Multi-step loading component
export interface MultiStepLoadingProps {
  steps: Array<{
    id: string;
    label: string;
    status: 'pending' | 'loading' | 'complete' | 'error';
    message?: string;
  }>;
  className?: string;
}

const MultiStepLoading = React.forwardRef<HTMLDivElement, MultiStepLoadingProps>(
  ({ steps, className, ...props }, ref) => {
    const { announce } = useScreenReader();
    const [lastCompletedStep, setLastCompletedStep] = React.useState<string | null>(null);

    // Announce step completions
    React.useEffect(() => {
      const completedSteps = steps.filter(step => step.status === 'complete');
      const latestCompleted = completedSteps[completedSteps.length - 1];
      
      if (latestCompleted && latestCompleted.id !== lastCompletedStep) {
        announce(`${latestCompleted.label} completed`, 'polite');
        setLastCompletedStep(latestCompleted.id);
      }
    }, [steps, lastCompletedStep, announce]);

    const getStepIcon = (status: string) => {
      switch (status) {
        case 'loading':
          return <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />;
        case 'complete':
          return <CheckCircle2 className="w-4 h-4 text-green-500" aria-hidden="true" />;
        case 'error':
          return <AlertCircle className="w-4 h-4 text-red-500" aria-hidden="true" />;
        default:
          return <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />;
      }
    };

    return (
      <div 
        ref={ref}
        className={cn("space-y-4", className)}
        role="status"
        aria-label="Multi-step loading progress"
        {...props}
      >
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-3">
            {getStepIcon(step.status)}
            <div className="flex-1">
              <div className={cn(
                "text-sm font-medium",
                step.status === 'complete' && "text-green-600",
                step.status === 'error' && "text-red-600",
                step.status === 'loading' && "text-primary",
                step.status === 'pending' && "text-muted-foreground"
              )}>
                {step.label}
              </div>
              {step.message && (
                <div className="text-xs text-muted-foreground mt-1">
                  {step.message}
                </div>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className="w-px h-8 bg-border ml-2" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    );
  }
);

MultiStepLoading.displayName = "MultiStepLoading";

export { LoadingState, Spinner, MultiStepLoading };