import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';

interface AdminTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  dangerColor: string;
  warningColor: string;
  successColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  borderRadius: string;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
}

interface AdminThemeContextType {
  theme: AdminTheme;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  updateTheme: (updates: Partial<AdminTheme>) => void;
  resetTheme: () => void;
}

const defaultLightTheme: AdminTheme = {
  primaryColor: 'hsl(221.2 83.2% 53.3%)',
  secondaryColor: 'hsl(210 40% 96%)',
  accentColor: 'hsl(221.2 83.2% 53.3%)',
  dangerColor: 'hsl(0 84.2% 60.2%)',
  warningColor: 'hsl(47.9 95.8% 53.1%)',
  successColor: 'hsl(142.1 76.2% 36.3%)',
  backgroundColor: 'hsl(0 0% 100%)',
  surfaceColor: 'hsl(0 0% 100%)',
  textColor: 'hsl(222.2 84% 4.9%)',
  mutedTextColor: 'hsl(215.4 16.3% 46.9%)',
  borderColor: 'hsl(214.3 31.8% 91.4%)',
  borderRadius: '0.5rem',
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
};

const defaultDarkTheme: AdminTheme = {
  ...defaultLightTheme,
  primaryColor: 'hsl(217.2 91.2% 59.8%)',
  secondaryColor: 'hsl(0 0% 15%)',
  backgroundColor: 'hsl(0 0% 0%)',
  surfaceColor: 'hsl(0 0% 10%)',
  textColor: 'hsl(210 40% 98%)',
  mutedTextColor: 'hsl(215 20.2% 65.1%)',
  borderColor: 'hsl(0 0% 20%)',
};

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

interface AdminThemeProviderProps {
  children: React.ReactNode;
}

export function AdminThemeProvider({ children }: AdminThemeProviderProps) {
  const { user } = useAdmin();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check for saved theme preference or system preference
    const saved = localStorage.getItem('admin-theme-mode');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [customTheme, setCustomTheme] = useState<Partial<AdminTheme>>(() => {
    // Load custom theme from localStorage
    const saved = localStorage.getItem(`admin-custom-theme-${user?.id || 'default'}`);
    return saved ? JSON.parse(saved) : {};
  });

  const theme = {
    ...(isDarkMode ? defaultDarkTheme : defaultLightTheme),
    ...customTheme,
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('admin-theme-mode', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  const updateTheme = (updates: Partial<AdminTheme>) => {
    setCustomTheme(prev => {
      const newTheme = { ...prev, ...updates };
      localStorage.setItem(`admin-custom-theme-${user?.id || 'default'}`, JSON.stringify(newTheme));
      return newTheme;
    });
  };

  const resetTheme = () => {
    setCustomTheme({});
    localStorage.removeItem(`admin-custom-theme-${user?.id || 'default'}`);
  };

  // Apply theme to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme colors
    root.style.setProperty('--admin-primary', theme.primaryColor);
    root.style.setProperty('--admin-secondary', theme.secondaryColor);
    root.style.setProperty('--admin-accent', theme.accentColor);
    root.style.setProperty('--admin-danger', theme.dangerColor);
    root.style.setProperty('--admin-warning', theme.warningColor);
    root.style.setProperty('--admin-success', theme.successColor);
    root.style.setProperty('--admin-background', theme.backgroundColor);
    root.style.setProperty('--admin-surface', theme.surfaceColor);
    root.style.setProperty('--admin-text', theme.textColor);
    root.style.setProperty('--admin-text-muted', theme.mutedTextColor);
    root.style.setProperty('--admin-border', theme.borderColor);
    root.style.setProperty('--admin-border-radius', theme.borderRadius);

    // Apply spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--admin-spacing-${key}`, value);
    });

    // Apply shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--admin-shadow-${key}`, value);
    });

    // Apply typography
    root.style.setProperty('--admin-font-family', theme.typography.fontFamily);
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--admin-text-${key}`, value);
    });
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--admin-font-${key}`, value);
    });

    // Apply dark mode class
    if (isDarkMode) {
      root.classList.add('admin-dark');
    } else {
      root.classList.remove('admin-dark');
    }
  }, [theme, isDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedPreference = localStorage.getItem('admin-theme-mode');
      if (!savedPreference) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const contextValue: AdminThemeContextType = {
    theme,
    isDarkMode,
    toggleDarkMode,
    updateTheme,
    resetTheme,
  };

  return (
    <AdminThemeContext.Provider value={contextValue}>
      <div className="admin-theme-root" data-theme={isDarkMode ? 'dark' : 'light'}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (context === undefined) {
    throw new Error('useAdminTheme must be used within an AdminThemeProvider');
  }
  return context;
}

// Theme utility functions
export const adminThemeUtils = {
  // Get CSS custom property value
  getCSSVar: (property: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(`--admin-${property}`);
  },

  // Apply theme-aware styles
  getThemedStyles: (lightStyles: React.CSSProperties, darkStyles: React.CSSProperties) => {
    const isDark = document.documentElement.classList.contains('admin-dark');
    return isDark ? darkStyles : lightStyles;
  },

  // Generate theme-aware class names
  getThemedClassName: (baseClass: string, darkClass?: string) => {
    const isDark = document.documentElement.classList.contains('admin-dark');
    return isDark && darkClass ? `${baseClass} ${darkClass}` : baseClass;
  },

  // Color manipulation utilities
  adjustOpacity: (color: string, opacity: number) => {
    // Simple opacity adjustment for HSL colors
    if (color.startsWith('hsl(')) {
      return color.replace(')', ` / ${opacity})`);
    }
    return color;
  },

  // Responsive spacing
  getResponsiveSpacing: (size: keyof AdminTheme['spacing']) => {
    return `var(--admin-spacing-${size})`;
  },
};

// CSS-in-JS styled components helper
export const adminStyles = {
  card: {
    backgroundColor: 'var(--admin-surface)',
    border: '1px solid var(--admin-border)',
    borderRadius: 'var(--admin-border-radius)',
    boxShadow: 'var(--admin-shadow-sm)',
    color: 'var(--admin-text)',
  },
  
  button: {
    primary: {
      backgroundColor: 'var(--admin-primary)',
      color: 'white',
      border: 'none',
      borderRadius: 'var(--admin-border-radius)',
      fontWeight: 'var(--admin-font-medium)',
    },
    
    secondary: {
      backgroundColor: 'var(--admin-secondary)',
      color: 'var(--admin-text)',
      border: '1px solid var(--admin-border)',
      borderRadius: 'var(--admin-border-radius)',
      fontWeight: 'var(--admin-font-medium)',
    },
    
    danger: {
      backgroundColor: 'var(--admin-danger)',
      color: 'white',
      border: 'none',
      borderRadius: 'var(--admin-border-radius)',
      fontWeight: 'var(--admin-font-medium)',
    },
  },
  
  input: {
    backgroundColor: 'var(--admin-surface)',
    border: '1px solid var(--admin-border)',
    borderRadius: 'var(--admin-border-radius)',
    color: 'var(--admin-text)',
    padding: 'var(--admin-spacing-sm) var(--admin-spacing-md)',
  },
  
  text: {
    primary: {
      color: 'var(--admin-text)',
      fontFamily: 'var(--admin-font-family)',
    },
    
    muted: {
      color: 'var(--admin-text-muted)',
      fontFamily: 'var(--admin-font-family)',
    },
    
    heading: {
      color: 'var(--admin-text)',
      fontFamily: 'var(--admin-font-family)',
      fontWeight: 'var(--admin-font-semibold)',
    },
  },
};