// Comprehensive Zod validation schemas for all data models
import { z } from 'zod';

// Base validation utilities
export const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format');
export const urlSchema = z.string().url('Invalid URL format');
export const emailSchema = z.string().email('Invalid email format');
export const handleSchema = z.string()
  .min(3, 'Handle must be at least 3 characters')
  .max(30, 'Handle must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Handle can only contain letters, numbers, underscores, and hyphens');

// Color and visual schemas
export const colorSwatchSchema = z.object({
  name: z.string().min(1, 'Color name is required').max(50, 'Color name too long'),
  hex: hexColorSchema,
});

export const fontPairSchema = z.object({
  heading: z.string().min(1, 'Heading font is required').max(100, 'Font name too long'),
  body: z.string().min(1, 'Body font is required').max(100, 'Font name too long'),
});

// AI analysis schemas
export const styleAnalysisSchema = z.object({
  tone: z.object({
    adjectives: z.array(z.string().min(1).max(50)).min(1, 'At least one tone adjective required').max(10, 'Too many tone adjectives'),
    dos: z.array(z.string().min(1).max(200)).max(10, 'Too many dos'),
    donts: z.array(z.string().min(1).max(200)).max(10, 'Too many donts'),
  }),
  signaturePhrases: z.array(z.string().min(1).max(200)).max(20, 'Too many signature phrases'),
  strengths: z.array(z.string().min(1).max(200)).min(1, 'At least one strength required').max(10, 'Too many strengths'),
  weaknesses: z.array(z.string().min(1).max(200)).max(10, 'Too many weaknesses'),
  tagline: z.string().min(1, 'Tagline is required').max(200, 'Tagline too long'),
  bioOneLiner: z.string().min(1, 'Bio one-liner is required').max(300, 'Bio one-liner too long'),
});

export const visualAnalysisSchema = z.object({
  palette: z.array(colorSwatchSchema).min(3, 'At least 3 colors required').max(8, 'Too many colors'),
  fonts: fontPairSchema,
  logoPrompt: z.string().min(1, 'Logo prompt is required').max(500, 'Logo prompt too long'),
});

// Format schemas
export const presentationFormatSchema = z.enum([
  'ufc', 'military', 'team', 'solo', 'nfl', 'influencer', 
  'executive', 'artist', 'humanitarian', 'creator', 'fashion', 'custom'
]);

export const customFormatConfigSchema = z.object({
  keywords: z.array(z.string().min(1).max(50)).min(1, 'At least one keyword required').max(10, 'Too many keywords'),
  tone: z.string().min(1, 'Tone is required').max(100, 'Tone description too long'),
  style: z.string().min(1, 'Style is required').max(200, 'Style description too long'),
});

// Usage example schema
export const usageExampleSchema = z.object({
  context: z.string().min(1, 'Context is required').max(200, 'Context too long'),
  example: z.string().min(1, 'Example is required').max(500, 'Example too long'),
});

// Link schema
export const linkSchema = z.object({
  label: z.string().min(1, 'Link label is required').max(50, 'Link label too long'),
  url: urlSchema,
});

// Role schema for CV
export const roleSchema = z.object({
  role: z.string().min(1, 'Role is required').max(100, 'Role title too long'),
  org: z.string().min(1, 'Organization is required').max(100, 'Organization name too long'),
  dates: z.string().min(1, 'Dates are required').max(50, 'Date range too long'),
  bullets: z.array(z.string().min(1).max(300)).min(1, 'At least one bullet point required').max(5, 'Too many bullet points'),
});

// Brand Rider schema
export const brandRiderSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  tagline: z.string().min(1, 'Tagline is required').max(200, 'Tagline too long'),
  voiceTone: z.array(z.string().min(1).max(100)).min(1, 'At least one voice tone required').max(10, 'Too many voice tones'),
  signaturePhrases: z.array(z.string().min(1).max(200)).max(20, 'Too many signature phrases'),
  strengths: z.array(z.string().min(1).max(200)).min(1, 'At least one strength required').max(10, 'Too many strengths'),
  weaknesses: z.array(z.string().min(1).max(200)).max(10, 'Too many weaknesses'),
  palette: z.array(colorSwatchSchema).min(3, 'At least 3 colors required').max(8, 'Too many colors'),
  fonts: fontPairSchema,
  bio: z.string().min(1, 'Bio is required').max(1000, 'Bio too long'),
  examples: z.array(usageExampleSchema).max(10, 'Too many usage examples'),
  format: presentationFormatSchema,
  customFormatConfig: customFormatConfigSchema.optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  isPublic: z.boolean().optional().default(false),
});

// CV schema
export const cvSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.string().min(1, 'Role is required').max(100, 'Role too long'),
  summary: z.string().min(1, 'Summary is required').max(500, 'Summary too long'),
  experience: z.array(roleSchema).min(1, 'At least one role required').max(5, 'Too many roles'),
  skills: z.array(z.string().min(1).max(50)).min(1, 'At least one skill required').max(20, 'Too many skills'),
  links: z.array(linkSchema).max(10, 'Too many links'),
  format: presentationFormatSchema,
  customFormatConfig: customFormatConfigSchema.optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  isPublic: z.boolean().optional().default(false),
});

// Profile schema
export const profileSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  handle: handleSchema,
  avatar: urlSchema.optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  roleTags: z.array(z.string().min(1).max(50)).max(10, 'Too many role tags'),
  socialLinks: z.array(linkSchema).max(10, 'Too many social links'),
  website: urlSchema.optional(),
  isPublic: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Upload schema
export const uploadSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  originalName: z.string().min(1, 'Original filename is required').max(255, 'Filename too long'),
  mimeType: z.string().min(1, 'MIME type is required'),
  sizeBytes: z.number().int().min(1, 'File size must be positive').max(50 * 1024 * 1024, 'File too large (max 50MB)'),
  extractedText: z.string().max(100000, 'Extracted text too long').optional(),
  storageUrl: urlSchema.optional(),
  processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  errorMessage: z.string().max(500, 'Error message too long').optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Generation input schemas
export const brandGenerationInputSchema = z.object({
  styleAnalysis: styleAnalysisSchema,
  visualAnalysis: visualAnalysisSchema,
  format: presentationFormatSchema,
  customFormatConfig: customFormatConfigSchema.optional(),
  userProfile: z.object({
    name: z.string().max(100).optional(),
    role: z.string().max(100).optional(),
    bio: z.string().max(500).optional(),
  }).optional(),
});

export const cvGenerationInputSchema = z.object({
  styleAnalysis: styleAnalysisSchema,
  extractedText: z.string().min(1, 'Extracted text is required').max(100000, 'Text too long'),
  format: presentationFormatSchema,
  customFormatConfig: customFormatConfigSchema.optional(),
  userProfile: z.object({
    name: z.string().max(100).optional(),
    role: z.string().max(100).optional(),
    bio: z.string().max(500).optional(),
    links: z.array(linkSchema).optional(),
  }).optional(),
});

// Share schema
export const shareSchema = z.object({
  id: z.string().uuid().optional(),
  token: z.string().min(1, 'Share token is required'),
  resourceType: z.enum(['brand', 'cv']),
  resourceId: z.string().uuid(),
  userId: z.string().uuid(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
});

// Form validation schemas (for client-side forms)
export const uploadFormSchema = z.object({
  files: z.array(z.instanceof(File)).min(1, 'At least one file is required'),
  enableOCR: z.boolean().default(false),
});

export const profileFormSchema = profileSchema.omit({ 
  id: true, 
  userId: true, 
  createdAt: true, 
  updatedAt: true 
});

export const brandEditFormSchema = brandRiderSchema.omit({ 
  id: true, 
  userId: true, 
  createdAt: true, 
  updatedAt: true 
});

export const cvEditFormSchema = cvSchema.omit({ 
  id: true, 
  userId: true, 
  createdAt: true, 
  updatedAt: true 
});

// Export all schemas for easy access
export const schemas = {
  // Core data models
  brandRider: brandRiderSchema,
  cv: cvSchema,
  profile: profileSchema,
  upload: uploadSchema,
  share: shareSchema,
  
  // Component schemas
  colorSwatch: colorSwatchSchema,
  fontPair: fontPairSchema,
  styleAnalysis: styleAnalysisSchema,
  visualAnalysis: visualAnalysisSchema,
  usageExample: usageExampleSchema,
  link: linkSchema,
  role: roleSchema,
  
  // Generation schemas
  brandGenerationInput: brandGenerationInputSchema,
  cvGenerationInput: cvGenerationInputSchema,
  
  // Form schemas
  uploadForm: uploadFormSchema,
  profileForm: profileFormSchema,
  brandEditForm: brandEditFormSchema,
  cvEditForm: cvEditFormSchema,
  
  // Format schemas
  presentationFormat: presentationFormatSchema,
  customFormatConfig: customFormatConfigSchema,
};

// Type exports for TypeScript
export type BrandRiderInput = z.infer<typeof brandRiderSchema>;
export type CVInput = z.infer<typeof cvSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type UploadInput = z.infer<typeof uploadSchema>;
export type ShareInput = z.infer<typeof shareSchema>;
export type BrandGenerationInput = z.infer<typeof brandGenerationInputSchema>;
export type CVGenerationInput = z.infer<typeof cvGenerationInputSchema>;
export type UploadFormInput = z.infer<typeof uploadFormSchema>;
export type ProfileFormInput = z.infer<typeof profileFormSchema>;
export type BrandEditFormInput = z.infer<typeof brandEditFormSchema>;
export type CVEditFormInput = z.infer<typeof cvEditFormSchema>;