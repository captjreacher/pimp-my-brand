import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of skeleton lines */
  lines?: number;
  /** Show avatar skeleton */
  avatar?: boolean;
  /** Show button skeleton */
  button?: boolean;
  /** Custom height for skeleton */
  height?: string;
  /** Animation speed */
  speed?: 'slow' | 'normal' | 'fast';
}

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ 
    className,
    lines = 3,
    avatar = false,
    button = false,
    height,
    speed = 'normal',
    ...props 
  }, ref) => {
    const speedClasses = {
      slow: 'animate-pulse [animation-duration:2s]',
      normal: 'animate-pulse',
      fast: 'animate-pulse [animation-duration:0.8s]'
    };

    return (
      <div 
        ref={ref}
        className={cn("space-y-3", className)}
        role="status"
        aria-label="Loading content"
        {...props}
      >
        {/* Avatar skeleton */}
        {avatar && (
          <div className="flex items-center space-x-4">
            <div className={cn(
              "rounded-full bg-muted",
              speedClasses[speed],
              "h-12 w-12"
            )} />
            <div className="space-y-2 flex-1">
              <div className={cn(
                "h-4 bg-muted rounded",
                speedClasses[speed],
                "w-1/4"
              )} />
              <div className={cn(
                "h-3 bg-muted rounded",
                speedClasses[speed],
                "w-1/3"
              )} />
            </div>
          </div>
        )}

        {/* Text lines skeleton */}
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, index) => {
            // Vary the width of skeleton lines for more realistic appearance
            const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-2/3'];
            const width = widths[index % widths.length];
            
            return (
              <div
                key={index}
                className={cn(
                  "bg-muted rounded",
                  speedClasses[speed],
                  height ? `h-[${height}]` : "h-4",
                  width
                )}
              />
            );
          })}
        </div>

        {/* Button skeleton */}
        {button && (
          <div className={cn(
            "h-10 bg-muted rounded-md w-24",
            speedClasses[speed]
          )} />
        )}

        {/* Screen reader text */}
        <span className="sr-only">Loading content, please wait...</span>
      </div>
    );
  }
);

LoadingSkeleton.displayName = "LoadingSkeleton";

export { LoadingSkeleton };