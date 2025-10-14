import { FormatTransformationContext, CustomFormatConfig, PresentationFormat } from './types';
import { getFormatOverlay } from './overlays';

export class FormatTransformer {
  /**
   * Transform content using the specified format overlay
   */
  static async transformContent(context: FormatTransformationContext): Promise<string> {
    const { format, customConfig, content, contentType } = context;
    
    if (!content || content.trim() === '') {
      return content;
    }

    const overlay = getFormatOverlay(format);
    
    // Build the transformation prompt
    let prompt = overlay.systemPrompt;
    
    // Add custom configuration for custom format
    if (format === 'custom' && customConfig) {
      prompt += `\n\nCustom Style Configuration:
- Keywords to incorporate: ${customConfig.keywords.join(', ')}
- Desired tone: ${customConfig.tone}
- Style preference: ${customConfig.style}`;
    }
    
    // Add content-specific instructions
    prompt += `\n\nContent Type: ${contentType}
Content to transform: "${content}"

Transform this content while:
1. Preserving all factual information and accuracy
2. Applying the specified format style and tone
3. Maintaining professional quality
4. Keeping the core message intact
5. Making it engaging and impactful

Return only the transformed content, no explanations or additional text.`;

    // For now, return a mock transformation since we don't have AI integration yet
    // In a real implementation, this would call the AI service
    return this.mockTransformation(content, format, contentType);
  }

  /**
   * Mock transformation for development/testing
   * This would be replaced with actual AI service calls
   */
  private static mockTransformation(
    content: string, 
    format: PresentationFormat, 
    contentType: string
  ): string {
    const overlay = getFormatOverlay(format);
    
    // Enhanced mock transformations based on format with more sophisticated patterns
    switch (format) {
      case 'ufc':
        return content
          .replace(/\b(led|managed|directed)\b/gi, 'DOMINATED')
          .replace(/\b(team|group)\b/gi, 'SQUAD')
          .replace(/\b(successful|good|great|excellent)\b/gi, 'CHAMPIONSHIP-LEVEL')
          .replace(/\b(delivered|completed|achieved)\b/gi, 'CRUSHED')
          .replace(/\b(innovative|creative)\b/gi, 'GAME-CHANGING')
          .toUpperCase();
      
      case 'military':
        return content
          .replace(/\b(completed|finished|done)\b/gi, 'MISSION ACCOMPLISHED')
          .replace(/\b(managed|led|directed)\b/gi, 'COMMANDED')
          .replace(/\b(team|group)\b/gi, 'UNIT')
          .replace(/\b(project|task)\b/gi, 'OPERATION')
          .replace(/\b(goals|objectives)\b/gi, 'MISSION OBJECTIVES');
      
      case 'team':
        return content
          .replace(/\b(experience|years)\b/gi, 'seasons')
          .replace(/\b(led|managed)\b/gi, 'CAPTAINED')
          .replace(/\b(successful|achieved)\b/gi, 'CHAMPIONSHIP')
          .replace(/\b(team|group)\b/gi, 'SQUAD')
          .replace(/\b(delivered|completed)\b/gi, 'SCORED');
      
      case 'solo':
        return content
          .replace(/\b(achieved|accomplished)\b/gi, 'PERSONAL BEST')
          .replace(/\b(improved|increased|enhanced)\b/gi, 'RECORD-BREAKING')
          .replace(/\b(successful|excellent)\b/gi, 'ELITE PERFORMANCE')
          .replace(/\b(delivered|completed)\b/gi, 'DOMINATED');
      
      case 'nfl':
        return content
          .replace(/\b(strategy|plan)\b/gi, 'PLAYBOOK')
          .replace(/\b(successful|achieved)\b/gi, 'TOUCHDOWN')
          .replace(/\b(led|managed)\b/gi, 'QUARTERBACKED')
          .replace(/\b(team|group)\b/gi, 'ROSTER')
          .replace(/\b(delivered|completed)\b/gi, 'SCORED');
      
      case 'influencer':
        return content
          .replace(/\b(successful|popular)\b/gi, 'VIRAL')
          .replace(/\b(led|managed)\b/gi, 'INFLUENCED')
          .replace(/\b(team|group)\b/gi, 'COMMUNITY')
          .replace(/\b(delivered|created)\b/gi, 'CURATED')
          .replace(/^(.+)$/, '✨ $1 ✨');
      
      case 'executive':
        return content
          .replace(/\b(managed|handled|led)\b/gi, 'STRATEGICALLY DIRECTED')
          .replace(/\b(improved|enhanced)\b/gi, 'TRANSFORMED')
          .replace(/\b(successful|achieved)\b/gi, 'DELIVERED RESULTS')
          .replace(/\b(team|group)\b/gi, 'ORGANIZATION')
          .replace(/\b(project|initiative)\b/gi, 'STRATEGIC INITIATIVE');
      
      case 'artist':
        return content
          .replace(/\b(created|made|developed)\b/gi, 'CRAFTED')
          .replace(/\b(successful|good|excellent)\b/gi, 'CRITICALLY ACCLAIMED')
          .replace(/\b(led|managed)\b/gi, 'ORCHESTRATED')
          .replace(/\b(innovative|creative)\b/gi, 'VISIONARY')
          .replace(/\b(delivered|completed)\b/gi, 'PREMIERED');
      
      case 'humanitarian':
        return content
          .replace(/\b(helped|assisted)\b/gi, 'EMPOWERED')
          .replace(/\b(improved|enhanced)\b/gi, 'TRANSFORMED LIVES')
          .replace(/\b(led|managed)\b/gi, 'CHAMPIONED')
          .replace(/\b(successful|achieved)\b/gi, 'CREATED IMPACT')
          .replace(/\b(team|group)\b/gi, 'COMMUNITY');
      
      case 'creator':
        return content
          .replace(/\b(popular|successful)\b/gi, 'VIRAL')
          .replace(/\b(audience|users|people)\b/gi, 'COMMUNITY')
          .replace(/\b(created|made|developed)\b/gi, 'PRODUCED')
          .replace(/\b(led|managed)\b/gi, 'BUILT')
          .replace(/\b(innovative|creative)\b/gi, 'TRENDING');
      
      case 'fashion':
        return content
          .replace(/\b(designed|created|developed)\b/gi, 'CURATED')
          .replace(/\b(attention to detail)\b/gi, 'EDITORIAL PRECISION')
          .replace(/\b(successful|excellent)\b/gi, 'RUNWAY-READY')
          .replace(/\b(led|managed)\b/gi, 'STYLED')
          .replace(/\b(innovative|creative)\b/gi, 'HAUTE COUTURE');
      
      default:
        return content;
    }
  }

  /**
   * Transform multiple content pieces with the same format
   */
  static async transformMultiple(
    contents: Array<{ content: string; contentType: FormatTransformationContext['contentType'] }>,
    format: PresentationFormat,
    customConfig?: CustomFormatConfig
  ): Promise<Array<{ content: string; transformed: string; contentType: string }>> {
    const results = [];
    
    for (const item of contents) {
      const transformed = await this.transformContent({
        format,
        customConfig,
        content: item.content,
        contentType: item.contentType
      });
      
      results.push({
        content: item.content,
        transformed,
        contentType: item.contentType
      });
    }
    
    return results;
  }

  /**
   * Get preview transformation for format selection
   */
  static getPreviewTransformation(
    sampleContent: string,
    format: PresentationFormat
  ): string {
    return this.mockTransformation(sampleContent, format, 'preview');
  }

  /**
   * Validate custom format configuration
   */
  static validateCustomConfig(config: CustomFormatConfig): boolean {
    return (
      config.keywords.length > 0 &&
      config.tone.trim() !== '' &&
      config.style.trim() !== ''
    );
  }
}

// Export utility functions
export function createTransformationContext(
  format: PresentationFormat,
  content: string,
  contentType: FormatTransformationContext['contentType'],
  customConfig?: CustomFormatConfig
): FormatTransformationContext {
  return {
    format,
    customConfig,
    content,
    contentType
  };
}

export function getFormatExamples(format: PresentationFormat) {
  const overlay = getFormatOverlay(format);
  return overlay.examples;
}