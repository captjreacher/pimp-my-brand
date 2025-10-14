/**
 * Accessibility utilities for WCAG AA compliance
 */

/**
 * Calculate color contrast ratio between two colors
 * Based on WCAG 2.1 guidelines
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string): number => {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
    const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
    
    // Apply gamma correction
    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    // Calculate relative luminance
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color contrast meets WCAG AA standards
 */
export function meetsContrastRequirement(
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Generate accessible color alternatives
 */
export function generateAccessibleColor(
  baseColor: string,
  backgroundColor: string = '#ffffff',
  targetRatio: number = 4.5
): string {
  const baseLuminance = calculateContrastRatio(baseColor, '#000000');
  const bgLuminance = calculateContrastRatio(backgroundColor, '#000000');
  
  // If background is dark, we need a lighter color
  // If background is light, we need a darker color
  const needsLighter = bgLuminance < 0.5;
  
  // Simple approach: adjust lightness
  const hex = baseColor.replace('#', '');
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);
  
  const adjustment = needsLighter ? 1.2 : 0.8;
  r = Math.min(255, Math.max(0, Math.round(r * adjustment)));
  g = Math.min(255, Math.max(0, Math.round(g * adjustment)));
  b = Math.min(255, Math.max(0, Math.round(b * adjustment)));
  
  const newColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  
  // Check if it meets the requirement
  if (calculateContrastRatio(newColor, backgroundColor) >= targetRatio) {
    return newColor;
  }
  
  // If not, return a safe fallback
  return needsLighter ? '#ffffff' : '#000000';
}

/**
 * Generate ARIA label for complex UI elements
 */
export function generateAriaLabel(
  element: string,
  state?: string,
  position?: { current: number; total: number },
  description?: string
): string {
  let label = element;
  
  if (state) {
    label += `, ${state}`;
  }
  
  if (position) {
    label += `, ${position.current} of ${position.total}`;
  }
  
  if (description) {
    label += `, ${description}`;
  }
  
  return label;
}

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusStack: HTMLElement[] = [];
  
  static pushFocus(element: HTMLElement): void {
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus) {
      this.focusStack.push(currentFocus);
    }
    element.focus();
  }
  
  static popFocus(): void {
    const previousFocus = this.focusStack.pop();
    if (previousFocus) {
      previousFocus.focus();
    }
  }
  
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
}

/**
 * Screen reader utilities
 */
export class ScreenReaderUtils {
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }
  
  static createLiveRegion(id: string, priority: 'polite' | 'assertive' = 'polite'): HTMLElement {
    let region = document.getElementById(id);
    
    if (!region) {
      region = document.createElement('div');
      region.id = id;
      region.setAttribute('aria-live', priority);
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      document.body.appendChild(region);
    }
    
    return region;
  }
  
  static updateLiveRegion(id: string, message: string): void {
    const region = document.getElementById(id);
    if (region) {
      region.textContent = message;
    }
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  static handleArrowKeys(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      horizontal?: boolean;
      vertical?: boolean;
      wrap?: boolean;
    } = { horizontal: true, vertical: true, wrap: true }
  ): number {
    const { horizontal = true, vertical = true, wrap = true } = options;
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowUp':
        if (vertical) {
          newIndex = wrap ? (currentIndex - 1 + items.length) % items.length : Math.max(0, currentIndex - 1);
          event.preventDefault();
        }
        break;
      case 'ArrowDown':
        if (vertical) {
          newIndex = wrap ? (currentIndex + 1) % items.length : Math.min(items.length - 1, currentIndex + 1);
          event.preventDefault();
        }
        break;
      case 'ArrowLeft':
        if (horizontal) {
          newIndex = wrap ? (currentIndex - 1 + items.length) % items.length : Math.max(0, currentIndex - 1);
          event.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (horizontal) {
          newIndex = wrap ? (currentIndex + 1) % items.length : Math.min(items.length - 1, currentIndex + 1);
          event.preventDefault();
        }
        break;
      case 'Home':
        newIndex = 0;
        event.preventDefault();
        break;
      case 'End':
        newIndex = items.length - 1;
        event.preventDefault();
        break;
    }
    
    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
    }
    
    return newIndex;
  }
}