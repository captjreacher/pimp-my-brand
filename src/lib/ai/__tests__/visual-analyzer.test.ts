import { describe, it, expect } from 'vitest';
import { VisualAnalyzer, ColorContrastValidator, GoogleFontsValidator } from '../visual-analyzer';

describe('ColorContrastValidator', () => {
  it('should calculate correct contrast ratios', () => {
    // Test with known values
    const whiteBlackRatio = ColorContrastValidator.getContrastRatio('#ffffff', '#000000');
    expect(whiteBlackRatio).toBeCloseTo(21, 1); // Perfect contrast
    
    const sameColorRatio = ColorContrastValidator.getContrastRatio('#ff0000', '#ff0000');
    expect(sameColorRatio).toBe(1); // Same color has 1:1 ratio
  });
  
  it('should validate WCAG AA compliance', () => {
    // High contrast should pass
    expect(ColorContrastValidator.meetsWCAGAA('#000000', '#ffffff')).toBe(true);
    
    // Low contrast should fail
    expect(ColorContrastValidator.meetsWCAGAA('#cccccc', '#ffffff')).toBe(false);
    
    // Large text has lower requirements
    expect(ColorContrastValidator.meetsWCAGAA('#767676', '#ffffff', true)).toBe(true);
  });
  
  it('should validate color palettes', () => {
    const goodPalette = [
      { name: 'Primary', hex: '#2563eb' },
      { name: 'Dark', hex: '#111827' },
      { name: 'Light', hex: '#f9fafb' }
    ];
    
    const validation = ColorContrastValidator.validatePalette(goodPalette);
    expect(validation.isValid).toBe(true);
    expect(validation.issues).toHaveLength(0);
  });
});

describe('GoogleFontsValidator', () => {
  it('should validate Google Fonts', () => {
    expect(GoogleFontsValidator.isValidGoogleFont('Roboto')).toBe(true);
    expect(GoogleFontsValidator.isValidGoogleFont('Inter')).toBe(true);
    expect(GoogleFontsValidator.isValidGoogleFont('NonExistentFont')).toBe(false);
  });
  
  it('should provide font recommendations', () => {
    const techRecommendations = GoogleFontsValidator.getRecommendations(['tech', 'developer'], ['engineer']);
    expect(techRecommendations).toHaveLength(3);
    expect(techRecommendations[0]).toHaveProperty('heading');
    expect(techRecommendations[0]).toHaveProperty('body');
  });
  
  it('should validate font pairs', () => {
    const validPair = { heading: 'Roboto', body: 'Inter' };
    const validation = GoogleFontsValidator.validateFontPair(validPair);
    expect(validation.isValid).toBe(true);
    
    const invalidPair = { heading: 'InvalidFont', body: 'AnotherInvalidFont' };
    const invalidValidation = GoogleFontsValidator.validateFontPair(invalidPair);
    expect(invalidValidation.isValid).toBe(false);
    expect(invalidValidation.issues.length).toBeGreaterThan(0);
  });
});

describe('VisualAnalyzer', () => {
  it('should generate color palettes', () => {
    const palette = VisualAnalyzer.generateColorPalette(['tech', 'developer'], ['engineer']);
    expect(palette).toHaveLength(5);
    expect(palette[0]).toHaveProperty('name');
    expect(palette[0]).toHaveProperty('hex');
    expect(palette[0].hex).toMatch(/^#[0-9a-f]{6}$/i);
  });
  
  it('should generate font recommendations', () => {
    const fonts = VisualAnalyzer.generateFontRecommendations(['creative', 'design'], ['designer']);
    expect(fonts).toHaveProperty('heading');
    expect(fonts).toHaveProperty('body');
    expect(GoogleFontsValidator.isValidGoogleFont(fonts.heading)).toBe(true);
    expect(GoogleFontsValidator.isValidGoogleFont(fonts.body)).toBe(true);
  });
  
  it('should generate logo prompts', () => {
    const prompt = VisualAnalyzer.generateLogoPrompt(
      ['tech', 'innovation'], 
      ['developer'], 
      'A passionate software developer who loves creating innovative solutions'
    );
    expect(prompt).toContain('logo');
    expect(prompt).toContain('minimal');
    expect(prompt).toContain('scalable');
  });
  
  it('should perform complete visual analysis', () => {
    const analysis = VisualAnalyzer.analyzeVisual(
      ['business', 'professional'], 
      ['manager'], 
      'An experienced business manager with a focus on strategic planning'
    );
    
    expect(analysis).toHaveProperty('palette');
    expect(analysis).toHaveProperty('fonts');
    expect(analysis).toHaveProperty('logoPrompt');
    expect(analysis.palette).toHaveLength(5);
    expect(analysis.fonts).toHaveProperty('heading');
    expect(analysis.fonts).toHaveProperty('body');
    expect(typeof analysis.logoPrompt).toBe('string');
  });
});