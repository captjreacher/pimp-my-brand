import * as React from "react";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface AccessibleInputProps extends React.ComponentProps<"input"> {
  /** Label text (required for accessibility) */
  label: string;
  /** Hide label visually but keep it for screen readers */
  hideLabel?: boolean;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Help text */
  helpText?: string;
  /** Required field indicator */
  required?: boolean;
  /** Character count for text inputs */
  maxLength?: number;
  /** Show character count */
  showCharacterCount?: boolean;
}

const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ 
    className,
    label,
    hideLabel = false,
    error,
    success,
    helpText,
    required = false,
    maxLength,
    showCharacterCount = false,
    id,
    ...props 
  }, ref) => {
    const [value, setValue] = React.useState(props.defaultValue || '');
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helpId = helpText ? `${inputId}-help` : undefined;
    const successId = success ? `${inputId}-success` : undefined;
    
    // Build describedby string
    const describedBy = [helpId, errorId, successId].filter(Boolean).join(' ') || undefined;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      props.onChange?.(e);
    };

    const characterCount = typeof value === 'string' ? value.length : 0;
    const isOverLimit = maxLength && characterCount > maxLength;

    return (
      <div className="space-y-2">
        <Label 
          htmlFor={inputId}
          className={cn(
            hideLabel && "sr-only",
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}
        >
          {label}
        </Label>
        
        <div className="relative">
          <Input
            ref={ref}
            id={inputId}
            className={cn(
              // Enhanced focus styles
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              // Error styles
              error && "border-red-500 focus-visible:ring-red-500",
              // Success styles
              success && "border-green-500 focus-visible:ring-green-500",
              // Character count padding
              showCharacterCount && maxLength && "pr-16",
              className
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-required={required}
            maxLength={maxLength}
            value={value}
            onChange={handleChange}
            {...props}
          />
          
          {/* Character count indicator */}
          {showCharacterCount && maxLength && (
            <div 
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 text-xs",
                isOverLimit ? "text-red-500" : "text-muted-foreground"
              )}
              aria-live="polite"
            >
              {characterCount}/{maxLength}
            </div>
          )}
          
          {/* Status icons */}
          {error && (
            <AlertCircle 
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" 
              aria-hidden="true"
            />
          )}
          {success && !error && (
            <CheckCircle2 
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" 
              aria-hidden="true"
            />
          )}
        </div>
        
        {/* Help text */}
        {helpText && (
          <p id={helpId} className="text-sm text-muted-foreground">
            {helpText}
          </p>
        )}
        
        {/* Error message */}
        {error && (
          <p id={errorId} className="text-sm text-red-500 flex items-center gap-1" role="alert">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {error}
          </p>
        )}
        
        {/* Success message */}
        {success && !error && (
          <p id={successId} className="text-sm text-green-600 flex items-center gap-1" role="status">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            {success}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = "AccessibleInput";

export { AccessibleInput };