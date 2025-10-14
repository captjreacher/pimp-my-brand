// Utility functions for visual analysis

import { ColorSwatch } from './types';

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Generate CSS custom properties for a color palette
 */
export function generateCSSVariables(palette: ColorSwatch[]): string {
  return palette
    .map(color => `  --color-${color.name.toLowerCase()}: ${color.hex};`)
    .join('\n');
}

/**
 * Generate Tailwind CSS color configuration
 */
export function generateTailwindColors(palette: ColorSwatch[]): Record<string, string> {
  const colors: Record<string, string> = {};
  palette.forEach(color => {
    colors[color.name.toLowerCase()] = color.hex;
  });
  return colors;
}

/**
 * Check if a color is considered "light" or "dark"
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  // Calculate perceived brightness using YIQ formula
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128;
}

/**
 * Generate Google Fonts URL for font loading
 */
export function generateGoogleFontsUrl(headingFont: string, bodyFont: string): string {
  const fonts = [headingFont, bodyFont];
  const uniqueFonts = [...new Set(fonts)]; // Remove duplicates
  
  const fontParams = uniqueFonts
    .map(font => `${font.replace(/\s+/g, '+')}:300,400,500,600,700`)
    .join('&family=');
  
  return `https://fonts.googleapis.com/css2?family=${fontParams}&display=swap`;
}

/**
 * Generate CSS font-family declarations
 */
export function generateFontFamilyCSS(headingFont: string, bodyFont: string): string {
  return `
:root {
  --font-heading: "${headingFont}", system-ui, -apple-system, sans-serif;
  --font-body: "${bodyFont}", system-ui, -apple-system, sans-serif;
}

.font-heading {
  font-family: var(--font-heading);
}

.font-body {
  font-family: var(--font-body);
}
`.trim();
}