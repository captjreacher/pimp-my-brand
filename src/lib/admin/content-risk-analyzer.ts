import { supabase } from '@/integrations/supabase/client';

export interface ContentRiskScore {
  overall_score: number;
  risk_factors: RiskFactor[];
  auto_flag: boolean;
  confidence: number;
}

export interface RiskFactor {
  type: 'profanity' | 'spam' | 'inappropriate_content' | 'suspicious_patterns' | 'policy_violation';
  severity: 'low' | 'medium' | 'high';
  description: string;
  score: number;
}

export interface ContentAnalysisInput {
  content_type: 'brand' | 'cv';
  title?: string;
  description?: string;
  content_data: any;
  user_id: string;
  user_history?: {
    previous_flags: number;
    account_age_days: number;
    content_count: number;
  };
}

export class ContentRiskAnalyzer {
  private readonly PROFANITY_PATTERNS = [
    // Basic profanity detection patterns
    /\b(fuck|shit|damn|hell|bitch|ass|crap)\b/gi,
    /\b(stupid|idiot|moron|dumb)\b/gi,
  ];

  private readonly SPAM_PATTERNS = [
    // Common spam indicators
    /\b(click here|buy now|limited time|act now|free money|guaranteed)\b/gi,
    /\b(viagra|casino|lottery|winner|congratulations)\b/gi,
    /(http[s]?:\/\/[^\s]+){3,}/gi, // Multiple URLs
    /(.)\1{10,}/gi, // Repeated characters
  ];

  private readonly SUSPICIOUS_PATTERNS = [
    // Suspicious content patterns
    /\b(hack|crack|pirate|illegal|stolen)\b/gi,
    /\b(password|login|account|credit card|ssn|social security)\b/gi,
    /[A-Z]{10,}/g, // Excessive caps
    /(.{1,3})\1{5,}/gi, // Repeated short patterns
  ];

  /**
   * Analyze content and calculate risk score
   */
  async analyzeContent(input: ContentAnalysisInput): Promise<ContentRiskScore> {
    const riskFactors: RiskFactor[] = [];
    
    // Extract text content for analysis
    const textContent = this.extractTextContent(input);
    
    // Run various risk assessments
    riskFactors.push(...this.checkProfanity(textContent));
    riskFactors.push(...this.checkSpamIndicators(textContent));
    riskFactors.push(...this.checkSuspiciousPatterns(textContent));
    riskFactors.push(...this.checkContentStructure(input));
    
    // Check user history if available
    if (input.user_history) {
      riskFactors.push(...this.checkUserHistory(input.user_history));
    }
    
    // Calculate overall risk score
    const overallScore = this.calculateOverallScore(riskFactors);
    const confidence = this.calculateConfidence(riskFactors, textContent.length);
    const autoFlag = this.shouldAutoFlag(overallScore, confidence);
    
    return {
      overall_score: overallScore,
      risk_factors: riskFactors,
      auto_flag: autoFlag,
      confidence
    };
  }

  /**
   * Extract text content from various content types
   */
  private extractTextContent(input: ContentAnalysisInput): string {
    let text = '';
    
    if (input.title) text += input.title + ' ';
    if (input.description) text += input.description + ' ';
    
    // Extract text from content_data based on type
    if (input.content_type === 'brand') {
      const brandData = input.content_data;
      if (brandData.tagline) text += brandData.tagline + ' ';
      if (brandData.description) text += brandData.description + ' ';
      if (brandData.values && Array.isArray(brandData.values)) {
        text += brandData.values.join(' ') + ' ';
      }
    } else if (input.content_type === 'cv') {
      const cvData = input.content_data;
      if (cvData.summary) text += cvData.summary + ' ';
      if (cvData.experience && Array.isArray(cvData.experience)) {
        cvData.experience.forEach((exp: any) => {
          if (exp.title) text += exp.title + ' ';
          if (exp.company) text += exp.company + ' ';
          if (exp.description) text += exp.description + ' ';
        });
      }
      if (cvData.skills && Array.isArray(cvData.skills)) {
        text += cvData.skills.join(' ') + ' ';
      }
    }
    
    return text.toLowerCase().trim();
  }

  /**
   * Check for profanity and inappropriate language
   */
  private checkProfanity(text: string): RiskFactor[] {
    const factors: RiskFactor[] = [];
    
    for (const pattern of this.PROFANITY_PATTERNS) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        factors.push({
          type: 'profanity',
          severity: matches.length > 3 ? 'high' : matches.length > 1 ? 'medium' : 'low',
          description: `Contains ${matches.length} potentially inappropriate word(s)`,
          score: Math.min(matches.length * 15, 60)
        });
        break; // Only add one profanity factor
      }
    }
    
    return factors;
  }

  /**
   * Check for spam indicators
   */
  private checkSpamIndicators(text: string): RiskFactor[] {
    const factors: RiskFactor[] = [];
    let totalSpamScore = 0;
    let spamIndicators = 0;
    
    for (const pattern of this.SPAM_PATTERNS) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        totalSpamScore += matches.length * 10;
        spamIndicators++;
      }
    }
    
    if (spamIndicators > 0) {
      factors.push({
        type: 'spam',
        severity: totalSpamScore > 30 ? 'high' : totalSpamScore > 15 ? 'medium' : 'low',
        description: `Contains ${spamIndicators} spam indicator(s)`,
        score: Math.min(totalSpamScore, 50)
      });
    }
    
    return factors;
  }

  /**
   * Check for suspicious patterns
   */
  private checkSuspiciousPatterns(text: string): RiskFactor[] {
    const factors: RiskFactor[] = [];
    let suspiciousScore = 0;
    let suspiciousCount = 0;
    
    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        suspiciousScore += matches.length * 8;
        suspiciousCount++;
      }
    }
    
    if (suspiciousCount > 0) {
      factors.push({
        type: 'suspicious_patterns',
        severity: suspiciousScore > 25 ? 'high' : suspiciousScore > 12 ? 'medium' : 'low',
        description: `Contains ${suspiciousCount} suspicious pattern(s)`,
        score: Math.min(suspiciousScore, 40)
      });
    }
    
    return factors;
  }

  /**
   * Check content structure for anomalies
   */
  private checkContentStructure(input: ContentAnalysisInput): RiskFactor[] {
    const factors: RiskFactor[] = [];
    const text = this.extractTextContent(input);
    
    // Check for extremely short or long content
    if (text.length < 10) {
      factors.push({
        type: 'inappropriate_content',
        severity: 'medium',
        description: 'Content is unusually short',
        score: 20
      });
    } else if (text.length > 10000) {
      factors.push({
        type: 'suspicious_patterns',
        severity: 'low',
        description: 'Content is unusually long',
        score: 10
      });
    }
    
    // Check for missing required fields
    if (input.content_type === 'brand') {
      const brandData = input.content_data;
      if (!brandData.tagline && !brandData.description) {
        factors.push({
          type: 'inappropriate_content',
          severity: 'low',
          description: 'Brand missing essential content',
          score: 15
        });
      }
    }
    
    return factors;
  }

  /**
   * Check user history for risk indicators
   */
  private checkUserHistory(history: NonNullable<ContentAnalysisInput['user_history']>): RiskFactor[] {
    const factors: RiskFactor[] = [];
    
    // New account risk
    if (history.account_age_days < 1) {
      factors.push({
        type: 'suspicious_patterns',
        severity: 'medium',
        description: 'Very new account (less than 1 day old)',
        score: 25
      });
    } else if (history.account_age_days < 7) {
      factors.push({
        type: 'suspicious_patterns',
        severity: 'low',
        description: 'New account (less than 1 week old)',
        score: 10
      });
    }
    
    // Previous flags
    if (history.previous_flags > 0) {
      const severity = history.previous_flags > 3 ? 'high' : history.previous_flags > 1 ? 'medium' : 'low';
      factors.push({
        type: 'policy_violation',
        severity,
        description: `User has ${history.previous_flags} previous flag(s)`,
        score: Math.min(history.previous_flags * 20, 60)
      });
    }
    
    // Unusual content volume
    if (history.content_count > 50 && history.account_age_days < 7) {
      factors.push({
        type: 'suspicious_patterns',
        severity: 'high',
        description: 'Unusually high content creation rate for new account',
        score: 35
      });
    }
    
    return factors;
  }

  /**
   * Calculate overall risk score from individual factors
   */
  private calculateOverallScore(factors: RiskFactor[]): number {
    if (factors.length === 0) return 0;
    
    const totalScore = factors.reduce((sum, factor) => sum + factor.score, 0);
    
    // Apply diminishing returns to prevent single factors from dominating
    const adjustedScore = Math.min(totalScore, 100);
    
    // Boost score if multiple high-severity factors
    const highSeverityCount = factors.filter(f => f.severity === 'high').length;
    if (highSeverityCount > 1) {
      return Math.min(adjustedScore * 1.2, 100);
    }
    
    return Math.round(adjustedScore);
  }

  /**
   * Calculate confidence in the risk assessment
   */
  private calculateConfidence(factors: RiskFactor[], textLength: number): number {
    let confidence = 0.5; // Base confidence
    
    // More text content increases confidence
    if (textLength > 100) confidence += 0.2;
    if (textLength > 500) confidence += 0.1;
    
    // Multiple risk factors increase confidence
    if (factors.length > 1) confidence += 0.1;
    if (factors.length > 3) confidence += 0.1;
    
    // High severity factors increase confidence
    const highSeverityCount = factors.filter(f => f.severity === 'high').length;
    confidence += highSeverityCount * 0.1;
    
    return Math.min(Math.round(confidence * 100) / 100, 1.0);
  }

  /**
   * Determine if content should be automatically flagged
   */
  private shouldAutoFlag(score: number, confidence: number): boolean {
    // Auto-flag if high score with reasonable confidence
    if (score >= 70 && confidence >= 0.7) return true;
    
    // Auto-flag if very high score regardless of confidence
    if (score >= 85) return true;
    
    // Auto-flag if moderate score with very high confidence
    if (score >= 50 && confidence >= 0.9) return true;
    
    return false;
  }

  /**
   * Get user history for risk analysis
   */
  async getUserHistory(userId: string): Promise<ContentAnalysisInput['user_history']> {
    try {
      // Get user profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single();
      
      if (!profile) return undefined;
      
      // Calculate account age
      const accountAge = Math.floor(
        (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Get previous flags count
      const { count: flagCount } = await supabase
        .from('content_moderation_queue')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      // Get content count
      const [brandsResult, cvsResult] = await Promise.all([
        supabase
          .from('brands')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('cvs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
      ]);
      
      const totalContent = (brandsResult.count || 0) + (cvsResult.count || 0);
      
      return {
        previous_flags: flagCount || 0,
        account_age_days: accountAge,
        content_count: totalContent
      };
    } catch (error) {
      console.error('Error getting user history:', error);
      return undefined;
    }
  }
}

export const contentRiskAnalyzer = new ContentRiskAnalyzer();