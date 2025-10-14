import * as React from "react";
import { cn } from "@/lib/utils";
import { AccessibleButton } from "./accessible-button";
import { AccessibleProgress } from "./accessible-progress";
import { ChevronLeft, ChevronRight, Check, Menu } from "lucide-react";
import { useScreenReader } from "@/hooks/use-accessibility";
import { Sheet, SheetContent, SheetTrigger } from "./sheet";

export interface MobileWizardStep {
  id: string;
  title: string;
  shortTitle?: string; // For mobile display
  description?: string;
  isComplete?: boolean;
  isOptional?: boolean;
}

export interface MobileWizardProps {
  /** Array of wizard steps */
  steps: MobileWizardStep[];
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

const MobileWizard = React.forwardRef<HTMLDivElement, MobileWizardProps>(
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
    const [stepSheetOpen, setStepSheetOpen] = React.useState(false);
    
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
        setStepSheetOpen(false);
      }
    };

    return (
      <div 
        ref={ref}
        className={cn("flex flex-col h-full", className)}
        role="region"
        aria-label="Multi-step wizard"
        {...props}
      >
        {/* Mobile header with step navigation */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between p-4">
            {/* Step navigation trigger */}
            <Sheet open={stepSheetOpen} onOpenChange={setStepSheetOpen}>
              <SheetTrigger asChild>
                <AccessibleButton
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  aria-label="View all steps"
                >
                  <Menu className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Steps</span>
                </AccessibleButton>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Wizard Steps</h3>
                  <nav aria-label="Wizard step navigation">
                    <ol className="space-y-2">
                      {steps.map((step, index) => {
                        const isCurrent = index === currentStep;
                        const isCompleted = step.isComplete;
                        const isClickable = allowStepNavigation && index !== currentStep;
                        
                        return (
                          <li key={step.id}>
                            <button
                              type="button"
                              onClick={() => handleStepClick(index)}
                              disabled={!isClickable}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                isCurrent && "bg-primary/10 border border-primary",
                                isCompleted && !isCurrent && "bg-green-50 border border-green-200",
                                !isCurrent && !isCompleted && "hover:bg-muted/50",
                                !isClickable && "cursor-default opacity-60"
                              )}
                              aria-current={isCurrent ? "step" : undefined}
                              aria-label={`${step.title}${isCurrent ? ' (current step)' : ''}${isCompleted ? ' (completed)' : ''}${step.isOptional ? ' (optional)' : ''}`}
                            >
                              <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0",
                                isCurrent && "border-primary bg-primary text-primary-foreground",
                                isCompleted && !isCurrent && "border-green-500 bg-green-500 text-white",
                                !isCurrent && !isCompleted && "border-muted bg-background text-muted-foreground"
                              )}>
                                {isCompleted ? (
                                  <Check className="w-4 h-4" aria-hidden="true" />
                                ) : (
                                  <span className="text-xs font-medium">{index + 1}</span>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className={cn(
                                  "font-medium truncate",
                                  isCurrent ? "text-primary" : "text-foreground"
                                )}>
                                  {step.shortTitle || step.title}
                                  {step.isOptional && (
                                    <span className="text-xs text-muted-foreground ml-1">(optional)</span>
                                  )}
                                </div>
                                {step.description && (
                                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {step.description}
                                  </div>
                                )}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Current step info */}
            <div className="flex-1 text-center">
              <div className="text-sm font-medium">
                {currentStepData?.shortTitle || currentStepData?.title}
              </div>
              <div className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>

            {/* Progress indicator */}
            <div className="text-xs text-muted-foreground">
              {Math.round(progressPercentage)}%
            </div>
          </div>

          {/* Progress bar */}
          {showProgress && (
            <div className="px-4 pb-2">
              <AccessibleProgress
                value={progressPercentage}
                label={`Wizard progress: ${completedSteps} of ${steps.length} steps completed`}
                size="sm"
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Step content */}
        <main 
          className="flex-1 overflow-y-auto"
          role="main"
          aria-labelledby={`step-${currentStep}-title`}
        >
          <div className="p-4 space-y-4">
            <div>
              <h2 
                id={`step-${currentStep}-title`}
                className="text-xl sm:text-2xl font-bold mb-2"
              >
                {currentStepData?.title}
              </h2>
              {currentStepData?.description && (
                <p className="text-muted-foreground text-sm sm:text-base">
                  {currentStepData.description}
                </p>
              )}
            </div>
            
            <div className="min-h-[300px]">
              {children}
            </div>
          </div>
        </main>

        {/* Mobile navigation buttons */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t p-4">
          <div className="flex items-center justify-between gap-4">
            <AccessibleButton
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={previousDisabled || currentStep === 0 || loading}
              className="flex items-center gap-2 flex-1 sm:flex-none"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{previousText}</span>
              <span className="sm:hidden">Back</span>
            </AccessibleButton>

            {isLastStep ? (
              <AccessibleButton
                type="button"
                onClick={onFinish}
                disabled={nextDisabled || loading}
                loading={loading}
                loadingText="Finishing..."
                className="flex-1 sm:flex-none"
                size="sm"
              >
                {finishText}
              </AccessibleButton>
            ) : (
              <AccessibleButton
                type="button"
                onClick={onNext}
                disabled={nextDisabled || loading}
                loading={loading}
                loadingText="Processing..."
                className="flex items-center gap-2 flex-1 sm:flex-none"
                size="sm"
              >
                <span className="hidden sm:inline">{nextText}</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </AccessibleButton>
            )}
          </div>
        </div>

        {/* Screen reader announcements */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {loading && "Processing step..."}
        </div>
      </div>
    );
  }
);

MobileWizard.displayName = "MobileWizard";

export { MobileWizard, type MobileWizardStep };