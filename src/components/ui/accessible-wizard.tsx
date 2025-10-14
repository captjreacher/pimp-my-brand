import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { AccessibleProgress } from "./accessible-progress";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useKeyboardNavigation, useScreenReader } from "@/hooks/use-accessibility";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  isComplete?: boolean;
  isOptional?: boolean;
}

export interface AccessibleWizardProps {
  /** Array of wizard steps */
  steps: WizardStep[];
  /** Current active step index */
  currentStep: number;
  /** Callback when step changes */
  onStepChange: (stepIndex: number) => void;
  /** Callback for next button */
  onNext?: () => void;
  /** Callback for previous button */
  onPrevious?: () => void;
  /** Callback for finish */
  onFinish?: () => void;
  /** Whether next button is disabled */
  nextDisabled?: boolean;
  /** Whether previous button is disabled */
  previousDisabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Custom next button text */
  nextText?: string;
  /** Custom previous button text */
  previousText?: string;
  /** Custom finish button text */
  finishText?: string;
  /** Show progress bar */
  showProgress?: boolean;
  /** Allow clicking on step indicators */
  allowStepNavigation?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const AccessibleWizard = React.forwardRef<HTMLDivElement, AccessibleWizardProps>(
  ({ 
    steps,
    currentStep,
    onStepChange,
    onNext,
    onPrevious,
    onFinish,
    nextDisabled = false,
    previousDisabled = false,
    loading = false,
    nextText = "Next",
    previousText = "Previous", 
    finishText = "Finish",
    showProgress = true,
    allowStepNavigation = true,
    className,
    children,
    ...props 
  }, ref) => {
    const { announce } = useScreenReader();
    const stepRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
    
    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const completedSteps = steps.filter(step => step.isComplete).length;
    const progressPercentage = (completedSteps / steps.length) * 100;

    // Announce step changes to screen readers
    React.useEffect(() => {
      if (currentStepData) {
        announce(
          `Step ${currentStep + 1} of ${steps.length}: ${currentStepData.title}`,
          'polite'
        );
      }
    }, [currentStep, currentStepData, steps.length, announce]);

    const handleStepClick = (stepIndex: number) => {
      if (allowStepNavigation && stepIndex !== currentStep) {
        onStepChange(stepIndex);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent, stepIndex: number) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleStepClick(stepIndex);
      }
    };

    return (
      <div 
        ref={ref}
        className={cn("space-y-6", className)}
        role="region"
        aria-label="Multi-step wizard"
        {...props}
      >
        {/* Progress indicator */}
        {showProgress && (
          <AccessibleProgress
            value={progressPercentage}
            label={`Wizard progress: ${completedSteps} of ${steps.length} steps completed`}
            showPercentage
            className="mb-6"
          />
        )}

        {/* Step indicators */}
        <nav aria-label="Wizard steps" className="mb-8">
          <ol className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCurrent = index === currentStep;
              const isCompleted = step.isComplete;
              const isClickable = allowStepNavigation && index !== currentStep;
              
              return (
                <li key={step.id} className="flex-1">
                  <div className="flex items-center">
                    <button
                      ref={el => stepRefs.current[index] = el}
                      type="button"
                      onClick={() => handleStepClick(index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      disabled={!isClickable}
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        isCurrent && "border-primary bg-primary text-primary-foreground",
                        isCompleted && !isCurrent && "border-green-500 bg-green-500 text-white",
                        !isCurrent && !isCompleted && "border-muted bg-background text-muted-foreground",
                        isClickable && "hover:border-primary hover:bg-primary/10 cursor-pointer",
                        !isClickable && "cursor-default"
                      )}
                      aria-current={isCurrent ? "step" : undefined}
                      aria-label={`${step.title}${isCurrent ? ' (current step)' : ''}${isCompleted ? ' (completed)' : ''}${step.isOptional ? ' (optional)' : ''}`}
                      tabIndex={isCurrent ? 0 : -1}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" aria-hidden="true" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </button>
                    
                    {/* Step connector line */}
                    {index < steps.length - 1 && (
                      <div 
                        className={cn(
                          "flex-1 h-0.5 mx-4 transition-colors",
                          isCompleted ? "bg-green-500" : "bg-muted"
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  
                  {/* Step label */}
                  <div className="mt-2 text-center">
                    <div className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step.title}
                      {step.isOptional && (
                        <span className="text-xs text-muted-foreground ml-1">(optional)</span>
                      )}
                    </div>
                    {step.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step content */}
        <main 
          id="wizard-content"
          className="min-h-[400px]"
          role="main"
          aria-labelledby={`step-${currentStep}-title`}
        >
          <div className="mb-6">
            <h2 
              id={`step-${currentStep}-title`}
              className="text-2xl font-bold mb-2"
            >
              {currentStepData?.title}
            </h2>
            {currentStepData?.description && (
              <p className="text-muted-foreground">
                {currentStepData.description}
              </p>
            )}
          </div>
          
          {children}
        </main>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={previousDisabled || currentStep === 0 || loading}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            {previousText}
          </Button>

          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>

          {isLastStep ? (
            <Button
              type="button"
              onClick={onFinish}
              disabled={nextDisabled || loading}
              loading={loading}
              loadingText="Finishing..."
            >
              {finishText}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || loading}
              loading={loading}
              loadingText="Processing..."
              className="flex items-center gap-2"
            >
              {nextText}
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* Screen reader announcements */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {loading && "Processing step..."}
        </div>
      </div>
    );
  }
);

AccessibleWizard.displayName = "AccessibleWizard";

export { AccessibleWizard, type WizardStep };