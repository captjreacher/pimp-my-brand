import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkipNavProps {
  /** Target element ID to skip to */
  targetId: string;
  /** Skip link text */
  children: React.ReactNode;
  className?: string;
}

/**
 * Skip navigation link for keyboard users
 * Appears when focused and allows users to skip to main content
 */
const SkipNav = React.forwardRef<HTMLAnchorElement, SkipNavProps>(
  ({ targetId, children, className, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    return (
      <a
        ref={ref}
        href={`#${targetId}`}
        onClick={handleClick}
        className={cn(
          // Hidden by default, visible on focus
          "absolute left-4 top-4 z-50",
          "translate-y-[-100%] focus:translate-y-0",
          "transition-transform duration-200",
          // Styling
          "bg-primary text-primary-foreground",
          "px-4 py-2 rounded-md",
          "text-sm font-medium",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "shadow-lg",
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  }
);

SkipNav.displayName = "SkipNav";

export { SkipNav };