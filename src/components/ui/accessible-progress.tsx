import * as React from "react";
import { Progress } from "./progress";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface AccessibleProgressProps {
  /** Current progress value (0-100) */
  value?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Progress label for screen readers */
  label: string;
  /** Show progress text visually */
  showProgress?: boolean;
  /** Show percentage */
  showPercentage?: boolean;
  /** Indeterminate progress (loading spinner) */
  indeterminate?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'default' | 'success' | 'warning' | 'error';
  /** Additional description */
  description?: string;
  className?: string;
}

const AccessibleProgress = React.forwardRef<HTMLDivElement, AccessibleProgressProps>(
  ({ 
    value = 0,
    max = 100,
    label,
    showProgress = false,
    showPercentage = false,
    indeterminate = false,
    size = 'md',
    variant = 'default',
    description,
    className,
    ...props 
  }, ref) => {
    const percentage = Math.round((value / max) * 100);
    const progressId = `progress-${Math.random().toString(36).substr(2, 9)}`;
    const descriptionId = description ? `${progressId}-desc` : undefined;

    const sizeClasses = {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4'
    };

    const variantClasses = {
      default: '',
      success: '[&>div]:bg-green-500',
      warning: '[&>div]:bg-yellow-500',
      error: '[&>div]:bg-red-500'
    };

    if (indeterminate) {
      return (
        <div 
          ref={ref}
          className={cn("flex items-center gap-3", className)}
          role="status"
          aria-label={label}
          aria-describedby={descriptionId}
          {...props}
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <div className="flex-1">
            <div className="text-sm font-medium">{label}</div>
            {description && (
              <div id={descriptionId} className="text-xs text-muted-foreground">
                {description}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div 
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      >
        {/* Progress label and percentage */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{label}</div>
          {(showProgress || showPercentage) && (
            <div className="text-sm text-muted-foreground">
              {showProgress && `${value}/${max}`}
              {showProgress && showPercentage && ' • '}
              {showPercentage && `${percentage}%`}
            </div>
          )}
        </div>
        
        {/* Progress bar */}
        <Progress
          value={value}
          max={max}
          className={cn(
            sizeClasses[size],
            variantClasses[variant]
          )}
          aria-label={`${label}: ${percentage}% complete`}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-describedby={descriptionId}
        />
        
        {/* Description */}
        {description && (
          <div id={descriptionId} className="text-xs text-muted-foreground">
            {description}
          </div>
        )}
        
        {/* Screen reader only progress announcement */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {label}: {percentage}% complete
        </div>
      </div>
    );
  }
);

AccessibleProgress.displayName = "AccessibleProgress";

export { AccessibleProgress };