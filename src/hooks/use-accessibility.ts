import { useEffect, useRef, useCallback, useState } from 'react';
import { FocusManager, ScreenReaderUtils, KeyboardNavigation } from '@/lib/accessibility/utils';

/**
 * Hook for managing focus within a component
 */
export function useFocusManagement() {
  const containerRef = useRef<HTMLElement>(null);
  const [focusTrapCleanup, setFocusTrapCleanup] = useState<(() => void) | null>(null);

  const trapFocus = useCallback(() => {
    if (containerRef.current && !focusTrapCleanup) {
      const cleanup = FocusManager.trapFocus(containerRef.current);
      setFocusTrapCleanup(() => cleanup);
    }
  }, [focusTrapCleanup]);

  const releaseFocus = useCallback(() => {
    if (focusTrapCleanup) {
      focusTrapCleanup();
      setFocusTrapCleanup(null);
    }
  }, [focusTrapCleanup]);

  const pushFocus = useCallback((element: HTMLElement) => {
    FocusManager.pushFocus(element);
  }, []);

  const popFocus = useCallback(() => {
    FocusManager.popFocus();
  }, []);

  useEffect(() => {
    return () => {
      if (focusTrapCleanup) {
        focusTrapCleanup();
      }
    };
  }, [focusTrapCleanup]);

  return {
    containerRef,
    trapFocus,
    releaseFocus,
    pushFocus,
    popFocus
  };
}

/**
 * Hook for managing screen reader announcements
 */
export function useScreenReader() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    ScreenReaderUtils.announce(message, priority);
  }, []);

  const createLiveRegion = useCallback((id: string, priority: 'polite' | 'assertive' = 'polite') => {
    return ScreenReaderUtils.createLiveRegion(id, priority);
  }, []);

  const updateLiveRegion = useCallback((id: string, message: string) => {
    ScreenReaderUtils.updateLiveRegion(id, message);
  }, []);

  return {
    announce,
    createLiveRegion,
    updateLiveRegion
  };
}

/**
 * Hook for keyboard navigation in lists/grids
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  items: T[],
  options: {
    horizontal?: boolean;
    vertical?: boolean;
    wrap?: boolean;
    onSelect?: (index: number, item: T) => void;
  } = {}
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { horizontal = true, vertical = true, wrap = true, onSelect } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const newIndex = KeyboardNavigation.handleArrowKeys(
      event,
      items,
      currentIndex,
      { horizontal, vertical, wrap }
    );

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }

    // Handle Enter and Space for selection
    if ((event.key === 'Enter' || event.key === ' ') && onSelect) {
      event.preventDefault();
      onSelect(currentIndex, items[currentIndex]);
    }
  }, [items, currentIndex, horizontal, vertical, wrap, onSelect]);

  const setFocusedIndex = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index);
      items[index]?.focus();
    }
  }, [items]);

  return {
    currentIndex,
    handleKeyDown,
    setFocusedIndex
  };
}

/**
 * Hook for managing ARIA attributes dynamically
 */
export function useAriaAttributes() {
  const [attributes, setAttributes] = useState<Record<string, string>>({});

  const updateAttribute = useCallback((key: string, value: string) => {
    setAttributes(prev => ({ ...prev, [key]: value }));
  }, []);

  const removeAttribute = useCallback((key: string) => {
    setAttributes(prev => {
      const newAttributes = { ...prev };
      delete newAttributes[key];
      return newAttributes;
    });
  }, []);

  const generateId = useCallback((prefix: string = 'element') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  return {
    attributes,
    updateAttribute,
    removeAttribute,
    generateId
  };
}

/**
 * Hook for managing loading states with accessibility
 */
export function useAccessibleLoading(isLoading: boolean, loadingMessage: string = 'Loading...') {
  const { announce } = useScreenReader();
  const [hasAnnounced, setHasAnnounced] = useState(false);

  useEffect(() => {
    if (isLoading && !hasAnnounced) {
      announce(loadingMessage, 'polite');
      setHasAnnounced(true);
    } else if (!isLoading && hasAnnounced) {
      announce('Loading complete', 'polite');
      setHasAnnounced(false);
    }
  }, [isLoading, loadingMessage, announce, hasAnnounced]);

  return {
    'aria-busy': isLoading,
    'aria-live': 'polite' as const,
    'aria-label': isLoading ? loadingMessage : undefined
  };
}

/**
 * Hook for managing form accessibility
 */
export function useFormAccessibility() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const setFieldTouched = useCallback((fieldName: string, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [fieldName]: isTouched }));
  }, []);

  const getFieldProps = useCallback((fieldName: string) => {
    const hasError = errors[fieldName] && touched[fieldName];
    const errorId = hasError ? `${fieldName}-error` : undefined;
    const describedBy = hasError ? errorId : undefined;

    return {
      'aria-invalid': hasError,
      'aria-describedby': describedBy,
      onBlur: () => setFieldTouched(fieldName, true),
      error: hasError ? errors[fieldName] : undefined,
      errorId
    };
  }, [errors, touched, setFieldTouched]);

  return {
    errors,
    touched,
    setFieldError,
    clearFieldError,
    setFieldTouched,
    getFieldProps
  };
}