// React Hook Form integration with Zod validation
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, UseFormProps, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { schemas } from './schemas';

// Generic form hook with validation
export function useValidatedForm<T extends z.ZodType>(
  schema: T,
  options?: UseFormProps<z.infer<T>>
): UseFormReturn<z.infer<T>> {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    ...options,
  });
}

// Specific form hooks for common forms
export function useUploadForm(options?: UseFormProps<z.infer<typeof schemas.uploadForm>>) {
  return useValidatedForm(schemas.uploadForm, {
    defaultValues: {
      files: [],
      enableOCR: false,
    },
    ...options,
  });
}

export function useProfileForm(options?: UseFormProps<z.infer<typeof schemas.profileForm>>) {
  return useValidatedForm(schemas.profileForm, {
    defaultValues: {
      displayName: '',
      handle: '',
      bio: '',
      roleTags: [],
      socialLinks: [],
      isPublic: false,
    },
    ...options,
  });
}

export function useBrandEditForm(options?: UseFormProps<z.infer<typeof schemas.brandEditForm>>) {
  return useValidatedForm(schemas.brandEditForm, {
    defaultValues: {
      title: '',
      tagline: '',
      voiceTone: [],
      signaturePhrases: [],
      strengths: [],
      weaknesses: [],
      palette: [],
      fonts: { heading: '', body: '' },
      bio: '',
      examples: [],
      format: 'executive' as const,
      isPublic: false,
    },
    ...options,
  });
}

export function useCVEditForm(options?: UseFormProps<z.infer<typeof schemas.cvEditForm>>) {
  return useValidatedForm(schemas.cvEditForm, {
    defaultValues: {
      name: '',
      role: '',
      summary: '',
      experience: [],
      skills: [],
      links: [],
      format: 'executive' as const,
      isPublic: false,
    },
    ...options,
  });
}

// Validation helpers for form fields
export const formValidationHelpers = {
  // File validation for upload forms
  validateFiles: (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (fileArray.length === 0) {
      return 'At least one file is required';
    }
    
    for (const file of fileArray) {
      if (file.size > 50 * 1024 * 1024) {
        return `File "${file.name}" is too large (max 50MB)`;
      }
      
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
        'image/jpeg',
        'image/png',
      ];
      
      if (!allowedTypes.includes(file.type)) {
        return `File "${file.name}" has unsupported type`;
      }
    }
    
    return true;
  },
  
  // URL validation
  validateUrl: (url: string) => {
    if (!url) return true; // Optional field
    
    try {
      new URL(url);
      return true;
    } catch {
      return 'Invalid URL format';
    }
  },
  
  // Handle validation
  validateHandle: (handle: string) => {
    if (!handle) return 'Handle is required';
    
    if (handle.length < 3) return 'Handle must be at least 3 characters';
    if (handle.length > 30) return 'Handle must be at most 30 characters';
    
    if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
      return 'Handle can only contain letters, numbers, underscores, and hyphens';
    }
    
    return true;
  },
  
  // Email validation
  validateEmail: (email: string) => {
    if (!email) return 'Email is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Invalid email format';
    }
    
    return true;
  },
  
  // Color validation
  validateHexColor: (color: string) => {
    if (!color) return 'Color is required';
    
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return 'Invalid hex color format (use #RRGGBB)';
    }
    
    return true;
  },
  
  // Array validation helpers
  validateStringArray: (arr: string[], minLength = 0, maxLength = 10, itemMaxLength = 100) => {
    if (arr.length < minLength) {
      return `At least ${minLength} item${minLength !== 1 ? 's' : ''} required`;
    }
    
    if (arr.length > maxLength) {
      return `Too many items (max ${maxLength})`;
    }
    
    for (const item of arr) {
      if (!item || item.trim().length === 0) {
        return 'All items must be non-empty';
      }
      
      if (item.length > itemMaxLength) {
        return `Item too long (max ${itemMaxLength} characters)`;
      }
    }
    
    return true;
  },
};

// Form field validation rules
export const fieldValidationRules = {
  required: { required: 'This field is required' },
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email format',
    },
  },
  handle: {
    required: 'Handle is required',
    minLength: { value: 3, message: 'Handle must be at least 3 characters' },
    maxLength: { value: 30, message: 'Handle must be at most 30 characters' },
    pattern: {
      value: /^[a-zA-Z0-9_-]+$/,
      message: 'Handle can only contain letters, numbers, underscores, and hyphens',
    },
  },
  url: {
    pattern: {
      value: /^https?:\/\/.+/,
      message: 'Invalid URL format',
    },
  },
  hexColor: {
    pattern: {
      value: /^#[0-9A-Fa-f]{6}$/,
      message: 'Invalid hex color format (use #RRGGBB)',
    },
  },
  shortText: {
    maxLength: { value: 100, message: 'Text too long (max 100 characters)' },
  },
  mediumText: {
    maxLength: { value: 500, message: 'Text too long (max 500 characters)' },
  },
  longText: {
    maxLength: { value: 1000, message: 'Text too long (max 1000 characters)' },
  },
};

// Custom validation functions for complex fields
export const customValidators = {
  // Validate color palette has good contrast
  validateColorPalette: (palette: Array<{ name: string; hex: string }>) => {
    if (palette.length < 3) {
      return 'At least 3 colors required';
    }
    
    if (palette.length > 8) {
      return 'Too many colors (max 8)';
    }
    
    // Check for duplicate colors
    const hexValues = palette.map(c => c.hex.toLowerCase());
    const uniqueHex = new Set(hexValues);
    if (uniqueHex.size !== hexValues.length) {
      return 'Duplicate colors are not allowed';
    }
    
    // Basic contrast check (simplified)
    const hasLightColor = palette.some(c => {
      const hex = c.hex.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128;
    });
    
    const hasDarkColor = palette.some(c => {
      const hex = c.hex.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness <= 128;
    });
    
    if (!hasLightColor || !hasDarkColor) {
      return 'Palette should include both light and dark colors for good contrast';
    }
    
    return true;
  },
  
  // Validate experience roles
  validateExperience: (experience: Array<{ role: string; org: string; dates: string; bullets: string[] }>) => {
    if (experience.length === 0) {
      return 'At least one role is required';
    }
    
    if (experience.length > 5) {
      return 'Too many roles (max 5)';
    }
    
    for (let i = 0; i < experience.length; i++) {
      const role = experience[i];
      
      if (!role.role || !role.org || !role.dates) {
        return `Role ${i + 1}: All fields are required`;
      }
      
      if (role.bullets.length === 0) {
        return `Role ${i + 1}: At least one bullet point is required`;
      }
      
      if (role.bullets.length > 5) {
        return `Role ${i + 1}: Too many bullet points (max 5)`;
      }
      
      for (const bullet of role.bullets) {
        if (!bullet || bullet.trim().length === 0) {
          return `Role ${i + 1}: All bullet points must be non-empty`;
        }
        
        if (bullet.length > 300) {
          return `Role ${i + 1}: Bullet point too long (max 300 characters)`;
        }
      }
    }
    
    return true;
  },
  
  // Validate social links
  validateSocialLinks: (links: Array<{ label: string; url: string }>) => {
    if (links.length > 10) {
      return 'Too many links (max 10)';
    }
    
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      
      if (!link.label || !link.url) {
        return `Link ${i + 1}: Both label and URL are required`;
      }
      
      try {
        new URL(link.url);
      } catch {
        return `Link ${i + 1}: Invalid URL format`;
      }
    }
    
    // Check for duplicate labels
    const labels = links.map(l => l.label.toLowerCase());
    const uniqueLabels = new Set(labels);
    if (uniqueLabels.size !== labels.length) {
      return 'Duplicate link labels are not allowed';
    }
    
    return true;
  },
};