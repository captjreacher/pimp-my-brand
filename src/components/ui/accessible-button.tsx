import * as React from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface AccessibleButtonProps extends ButtonProps {
  /** Loading state with accessible feedback */
  loading?: boolean;
  /** Loading text for screen readers */
  loadingText?: string;
  /** Expanded state for toggle buttons */
  expanded?: boolean;
  /** Pressed state for toggle buttons */
  pressed?: boolean;
  /** Describes what the button controls */
  controls?: string;
  /** Describes what element this button describes */
  describedBy?: string;
  /** Position in a set (e.g., "1 of 5") */
  positionInSet?: { current: number; total: number };
  /** Keyboard shortcut hint */
  shortcut?: string;
}

const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    className, 
    children, 
    loading = false, 
    loadingText = "Loading...",
    expanded,
    pressed,
    controls,
    describedBy,
    positionInSet,
    shortcut,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;
    
    // Generate ARIA attributes
    const ariaAttributes: Record<string, any> = {};
    
    if (expanded !== undefined) {
      ariaAttributes['aria-expanded'] = expanded;
    }
    
    if (pressed !== undefined) {
      ariaAttributes['aria-pressed'] = pressed;
    }
    
    if (controls) {
      ariaAttributes['aria-controls'] = controls;
    }
    
    if (describedBy) {
      ariaAttributes['aria-describedby'] = describedBy;
    }
    
    if (positionInSet) {
      ariaAttributes['aria-setsize'] = positionInSet.total;
      ariaAttributes['aria-posinset'] = positionInSet.current;
    }
    
    if (loading) {
      ariaAttributes['aria-busy'] = true;
      ariaAttributes['aria-live'] = 'polite';
    }

    // Create accessible label
    let accessibleLabel = '';
    if (typeof children === 'string') {
      accessibleLabel = children;
    }
    
    if (loading && loadingText) {
      accessibleLabel = loadingText;
    }
    
    if (shortcut) {
      accessibleLabel += ` (${shortcut})`;
    }

    return (
      <Button
        ref={ref}
        className={cn(
          // Enhanced focus styles for better visibility
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Loading state styles
          loading && "cursor-wait",
          className
        )}
        disabled={isDisabled}
        aria-label={accessibleLabel || undefined}
        {...ariaAttributes}
        {...props}
      >
        {loading && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">{loadingText}</span>
          </>
        )}
        {!loading && children}
      </Button>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

export { AccessibleButton };