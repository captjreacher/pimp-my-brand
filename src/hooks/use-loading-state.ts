import { useState, useCallback, useRef } from 'react';
import { useScreenReader } from './use-accessibility';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingStateOptions {
  /** Default loading message */
  defaultMessage?: string;
  /** Default success message */
  defaultSuccessMessage?: string;
  /** Auto-reset success/error state after delay (ms) */
  autoResetDelay?: number;
  /** Announce state changes to screen readers */
  announceChanges?: boolean;
}

export interface UseLoadingStateReturn {
  /** Current loading state */
  state: LoadingState;
  /** Current message */
  message: string;
  /** Current error message */
  error: string | null;
  /** Current progress (0-100) */
  progress: number;
  /** Set loading state */
  setLoading: (message?: string) => void;
  /** Set success state */
  setSuccess: (message?: string) => void;
  /** Set error state */
  setError: (error: string) => void;
  /** Reset to idle state */
  reset: () => void;
  /** Update progress */
  setProgress: (progress: number) => void;
  /** Increment progress */
  incrementProgress: (amount?: number) => void;
  /** Execute async function with loading state management */
  execute: <T>(
    asyncFn: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ) => Promise<T | null>;
}

export function useLoadingState(options: LoadingStateOptions = {}): UseLoadingStateReturn {
  const {
    defaultMessage = 'Loading...',
    defaultSuccessMessage = 'Success!',
    autoResetDelay = 3000,
    announceChanges = true
  } = options;

  const [state, setState] = useState<LoadingState>('idle');
  const [message, setMessage] = useState('');
  const [error, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgressValue] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { announce } = useScreenReader();

  const clearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleReset = useCallback(() => {
    if (autoResetDelay > 0) {
      clearTimeout();
      timeoutRef.current = setTimeout(() => {
        setState('idle');
        setMessage('');
        setErrorMessage(null);
        setProgressValue(0);
      }, autoResetDelay);
    }
  }, [autoResetDelay, clearTimeout]);

  const setLoading = useCallback((loadingMessage?: string) => {
    clearTimeout();
    setState('loading');
    setMessage(loadingMessage || defaultMessage);
    setErrorMessage(null);
    
    if (announceChanges) {
      announce(loadingMessage || defaultMessage, 'polite');
    }
  }, [defaultMessage, announceChanges, announce, clearTimeout]);

  const setSuccess = useCallback((successMessage?: string) => {
    clearTimeout();
    setState('success');
    const msg = successMessage || defaultSuccessMessage;
    setMessage(msg);
    setErrorMessage(null);
    
    if (announceChanges) {
      announce(msg, 'polite');
    }
    
    scheduleReset();
  }, [defaultSuccessMessage, announceChanges, announce, clearTimeout, scheduleReset]);

  const setError = useCallback((errorMessage: string) => {
    clearTimeout();
    setState('error');
    setMessage('');
    setErrorMessage(errorMessage);
    setProgressValue(0);
    
    if (announceChanges) {
      announce(`Error: ${errorMessage}`, 'assertive');
    }
    
    scheduleReset();
  }, [announceChanges, announce, clearTimeout, scheduleReset]);

  const reset = useCallback(() => {
    clearTimeout();
    setState('idle');
    setMessage('');
    setErrorMessage(null);
    setProgressValue(0);
  }, [clearTimeout]);

  const setProgress = useCallback((newProgress: number) => {
    setProgressValue(Math.max(0, Math.min(100, newProgress)));
  }, []);

  const incrementProgress = useCallback((amount: number = 10) => {
    setProgressValue(prev => Math.max(0, Math.min(100, prev + amount)));
  }, []);

  const execute = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    executeOptions: {
      loadingMessage?: string;
      successMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<T | null> => {
    const {
      loadingMessage,
      successMessage,
      onSuccess,
      onError
    } = executeOptions;

    try {
      setLoading(loadingMessage);
      const result = await asyncFn();
      
      setSuccess(successMessage);
      onSuccess?.(result);
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error.message);
      onError?.(error);
      
      return null;
    }
  }, [setLoading, setSuccess, setError]);

  return {
    state,
    message,
    error,
    progress,
    setLoading,
    setSuccess,
    setError,
    reset,
    setProgress,
    incrementProgress,
    execute
  };
}

// Multi-step loading state hook
export interface MultiStepLoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
  message?: string;
}

export interface UseMultiStepLoadingReturn {
  /** Current steps */
  steps: MultiStepLoadingStep[];
  /** Current active step index */
  currentStepIndex: number;
  /** Overall progress percentage */
  progress: number;
  /** Set step status */
  setStepStatus: (stepId: string, status: MultiStepLoadingStep['status'], message?: string) => void;
  /** Move to next step */
  nextStep: () => void;
  /** Reset all steps */
  reset: () => void;
  /** Execute steps sequentially */
  executeSteps: (
    stepExecutors: Array<{
      stepId: string;
      executor: () => Promise<void>;
      loadingMessage?: string;
      successMessage?: string;
    }>
  ) => Promise<boolean>;
}

export function useMultiStepLoading(
  initialSteps: Array<{ id: string; label: string }>
): UseMultiStepLoadingReturn {
  const [steps, setSteps] = useState<MultiStepLoadingStep[]>(
    initialSteps.map(step => ({ ...step, status: 'pending' as const }))
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { announce } = useScreenReader();

  const progress = (steps.filter(step => step.status === 'complete').length / steps.length) * 100;

  const setStepStatus = useCallback((
    stepId: string, 
    status: MultiStepLoadingStep['status'], 
    message?: string
  ) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message }
        : step
    ));

    if (status === 'complete') {
      const step = steps.find(s => s.id === stepId);
      if (step) {
        announce(`${step.label} completed`, 'polite');
      }
    }
  }, [steps, announce]);

  const nextStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const reset = useCallback(() => {
    setSteps(prev => prev.map(step => ({ 
      ...step, 
      status: 'pending' as const, 
      message: undefined 
    })));
    setCurrentStepIndex(0);
  }, []);

  const executeSteps = useCallback(async (
    stepExecutors: Array<{
      stepId: string;
      executor: () => Promise<void>;
      loadingMessage?: string;
      successMessage?: string;
    }>
  ): Promise<boolean> => {
    try {
      for (const { stepId, executor, loadingMessage, successMessage } of stepExecutors) {
        setStepStatus(stepId, 'loading', loadingMessage);
        
        try {
          await executor();
          setStepStatus(stepId, 'complete', successMessage);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Step failed';
          setStepStatus(stepId, 'error', errorMessage);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Multi-step execution failed:', error);
      return false;
    }
  }, [setStepStatus]);

  return {
    steps,
    currentStepIndex,
    progress,
    setStepStatus,
    nextStep,
    reset,
    executeSteps
  };
}