#!/usr/bin/env node
/**
 * Temporary Brand Rider Fix
 * Creates a local fallback for the generate-brand-rider function
 */

// This creates a simple brand rider template that can be used
// until the Edge Function is properly deployed

const createBrandRiderMarkdown = (styleData, visualData, format = 'custom') => {
  const tagline = styleData?.tagline || 'Professional Excellence';
  const bio = styleData?.bio || 'A dedicated professional focused on delivering quality results.';
  const strengths = styleData?.strengths || ['reliability', 'communication', 'problem-solving'];
  const weaknesses = styleData?.weaknesses || ['may need more specific context'];
  const toneAdjectives = styleData?.tone?.adjectives || ['professional', 'clear', 'focused'];
  const signaturePhrases = styleData?.signature_phrases || ['Let\'s get it done', 'Quality first', 'Clear communication'];
  
  const palette = visualData?.palette || [
    { name: 'Primary', hex: '#3B82F6' },
    { name: 'Secondary', hex: '#1E40AF' },
    { name: 'Accent', hex: '#F59E0B' },
    { name: 'Dark', hex: '#111827' },
    { name: 'Light', hex: '#F9FAFB' }
  ];
  
  const fonts = visualData?.fonts || { heading: 'Inter', body: 'Inter' };

  return `# Brand Rider

## Tagline
${tagline}

## Voice & Tone
${toneAdjectives.map(adj => `- ${adj.charAt(0).toUpperCase() + adj.slice(1)}`).join('\n')}

## Signature Phrases
${signaturePhrases.map(phrase => `- "${phrase}"`).join('\n')}

## Strengths & Watch-outs
**Strengths:**
${strengths.map(strength => `- ${strength.charAt(0).toUpperCase() + strength.slice(1)}`).join('\n')}

**Watch-outs:**
${weaknesses.map(weakness => `- ${weakness.charAt(0).toUpperCase() + weakness.slice(1)}`).join('\n')}

## Color & Type
**Color Palette:**
${palette.map(color => `- ${color.name}: ${color.hex}`).join('\n')}

**Typography:**
- Heading: ${fonts.heading}
- Body: ${fonts.body}

## Bio
${bio}

## Usage Examples
1. **Email opener**: "Hi there! ${signaturePhrases[0] || 'Let\'s get started'} - I'm excited to collaborate on this project."
2. **LinkedIn about**: "${bio.substring(0, 100)}... ${tagline}"
3. **Website hero**: "${tagline} - ${bio.split('.')[0]}."`;
};

console.log('✅ Temporary brand rider fix created');
console.log('This can be used as a fallback until the Edge Function is deployed.');

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createBrandRiderMarkdown };
}