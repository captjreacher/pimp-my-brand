import { 
  CV, 
  CVGenerationInput, 
  CVTemplate, 
  CVSection,
  CVHeaderSection,
  Role,
  Link,
  GenerationOptions 
} from './types';
import { FormatTransformer } from '../formats/transformer';
import { StyleAnalysis } from '../ai/types';

export class CVGenerator {
  /**
   * Generate a complete CV document
   */
  static async generate(
    input: CVGenerationInput,
    options: GenerationOptions = {}
  ): Promise<CV> {
    const { styleAnalysis, extractedText, format, customFormatConfig, userProfile } = input;
    
    // Extract and parse experience from text
    const experience = await this.extractExperience(extractedText, format, customFormatConfig, options);
    
    // Extract skills from text and style analysis
    const skills = await this.extractSkills(extractedText, styleAnalysis, format, customFormatConfig);
    
    // Generate professional summary
    const summary = await this.generateSummary(styleAnalysis, format, customFormatConfig);
    
    // Transform user profile data
    const name = userProfile?.name || 'Professional Name';
    const role = userProfile?.role || await this.extractRole(extractedText, format, customFormatConfig);
    const links = userProfile?.links || [];

    // Create the CV
    const cv: CV = {
      name,
      role,
      summary,
      experience,
      skills,
      links,
      format,
      customFormatConfig,
      isPublic: false
    };

    return cv;
  }

  /**
   * Extract and format experience from text content
   */
  private static async extractExperience(
    text: string,
    format: any,
    customFormatConfig?: any,
    options: GenerationOptions = {}
  ): Promise<Role[]> {
    const maxRoles = options.maxExperienceRoles || 3;
    const maxBullets = options.maxBulletsPerRole || 3;
    
    // Parse experience from text (simplified extraction)
    const roles = this.parseRolesFromText(text, maxRoles);
    
    // Transform each role with format overlay
    const transformedRoles = await Promise.all(
      roles.map(async (role) => ({
        ...role,
        bullets: await Promise.all(
          role.bullets.slice(0, maxBullets).map(bullet =>
            FormatTransformer.transformContent({
              format,
              customConfig: customFormatConfig,
              content: bullet,
              contentType: 'experience'
            })
          )
        )
      }))
    );

    return transformedRoles;
  }

  /**
   * Parse roles from text content (simplified implementation)
   */
  private static parseRolesFromText(text: string, maxRoles: number): Role[] {
    // This is a simplified implementation
    // In a real system, this would use more sophisticated NLP
    const defaultRoles: Role[] = [
      {
        role: 'Senior Professional',
        org: 'Leading Organization',
        dates: '2020 - Present',
        bullets: [
          'Led strategic initiatives that improved operational efficiency',
          'Managed cross-functional teams to deliver key projects',
          'Developed innovative solutions that enhanced customer satisfaction'
        ]
      },
      {
        role: 'Professional',
        org: 'Previous Company',
        dates: '2018 - 2020',
        bullets: [
          'Implemented process improvements that reduced costs',
          'Collaborated with stakeholders to achieve business objectives',
          'Mentored junior team members and facilitated knowledge transfer'
        ]
      },
      {
        role: 'Associate Professional',
        org: 'Early Career Company',
        dates: '2016 - 2018',
        bullets: [
          'Contributed to team success through dedicated work ethic',
          'Learned industry best practices and applied them effectively',
          'Built strong relationships with clients and colleagues'
        ]
      }
    ];

    // Try to extract actual roles from text
    const extractedRoles = this.extractRolesFromText(text);
    
    // Use extracted roles if available, otherwise use defaults
    const roles = extractedRoles.length > 0 ? extractedRoles : defaultRoles;
    
    return roles.slice(0, maxRoles);
  }

  /**
   * Extract roles from text using pattern matching
   */
  private static extractRolesFromText(text: string): Role[] {
    const roles: Role[] = [];
    
    // Look for common patterns like "Software Engineer at Company (2020-2022)"
    const rolePatterns = [
      /([A-Z][a-zA-Z\s]+(?:Engineer|Manager|Director|Analyst|Specialist|Coordinator|Lead|Developer|Designer))\s+at\s+([A-Z][a-zA-Z\s&.]+)(?:\s*\(([0-9]{4}[-–—]\s*(?:[0-9]{4}|Present))\))?/gi,
      /([A-Z][a-zA-Z\s]+(?:Engineer|Manager|Director|Analyst|Specialist|Coordinator|Lead|Developer|Designer))\s*[-–—]\s*([A-Z][a-zA-Z\s&.]+)(?:\s*\(([0-9]{4}[-–—]\s*(?:[0-9]{4}|Present))\))?/gi
    ];

    for (const pattern of rolePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        roles.push({
          role: match[1].trim(),
          org: match[2].trim(),
          dates: match[3] || 'Dates not specified',
          bullets: [
            'Contributed to organizational success through professional excellence',
            'Applied expertise to deliver meaningful results',
            'Collaborated effectively with team members and stakeholders'
          ]
        });
      }
    }

    return roles;
  }

  /**
   * Extract skills from text and style analysis
   */
  private static async extractSkills(
    text: string,
    styleAnalysis: StyleAnalysis,
    format: any,
    customFormatConfig?: any
  ): Promise<string[]> {
    // Combine strengths from style analysis with extracted skills
    const baseSkills = [
      ...styleAnalysis.strengths,
      'Leadership',
      'Communication',
      'Problem Solving',
      'Strategic Thinking',
      'Team Collaboration'
    ];

    // Extract technical skills from text
    const technicalSkills = this.extractTechnicalSkills(text);
    
    // Combine and deduplicate
    const allSkills = [...new Set([...baseSkills, ...technicalSkills])];
    
    // Transform skills with format overlay
    const transformedSkills = await Promise.all(
      allSkills.slice(0, 12).map(skill => // Limit to 12 skills
        FormatTransformer.transformContent({
          format,
          customConfig: customFormatConfig,
          content: skill,
          contentType: 'strengths'
        })
      )
    );

    return transformedSkills;
  }

  /**
   * Extract technical skills from text
   */
  private static extractTechnicalSkills(text: string): string[] {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
      'Project Management', 'Agile', 'Scrum', 'Data Analysis', 'Machine Learning',
      'Marketing', 'Sales', 'Customer Service', 'Finance', 'Operations'
    ];

    const foundSkills = commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );

    return foundSkills;
  }

  /**
   * Generate professional summary
   */
  private static async generateSummary(
    styleAnalysis: StyleAnalysis,
    format: any,
    customFormatConfig?: any
  ): Promise<string> {
    const baseSummary = `${styleAnalysis.bioOneLiner} ${styleAnalysis.tagline}`;
    
    const transformedSummary = await FormatTransformer.transformContent({
      format,
      customConfig: customFormatConfig,
      content: baseSummary,
      contentType: 'summary'
    });

    return transformedSummary;
  }

  /**
   * Extract role from text
   */
  private static async extractRole(
    text: string,
    format: any,
    customFormatConfig?: any
  ): Promise<string> {
    // Look for role patterns in text
    const rolePatterns = [
      /(?:I am|I'm)\s+(?:a|an)\s+([A-Z][a-zA-Z\s]+(?:Engineer|Manager|Director|Analyst|Specialist|Coordinator|Lead|Developer|Designer))/i,
      /(?:Position|Role|Title):\s*([A-Z][a-zA-Z\s]+)/i,
      /([A-Z][a-zA-Z\s]+(?:Engineer|Manager|Director|Analyst|Specialist|Coordinator|Lead|Developer|Designer))\s+with/i
    ];

    for (const pattern of rolePatterns) {
      const match = text.match(pattern);
      if (match) {
        const role = await FormatTransformer.transformContent({
          format,
          customConfig: customFormatConfig,
          content: match[1].trim(),
          contentType: 'summary'
        });
        return role;
      }
    }

    return 'Professional';
  }

  /**
   * Create a template structure for the CV
   */
  static createTemplate(cv: CV): CVTemplate {
    const header: CVHeaderSection = {
      name: cv.name,
      role: cv.role,
      summary: cv.summary,
      links: cv.links
    };

    const sections: CVSection[] = [
      {
        id: 'experience',
        title: 'Professional Experience',
        content: JSON.stringify(cv.experience),
        type: 'experience'
      },
      {
        id: 'skills',
        title: 'Core Competencies',
        content: cv.skills.join(', '),
        type: 'skills'
      }
    ];

    return {
      header,
      sections
    };
  }

  /**
   * Update an existing CV with new format
   */
  static async updateFormat(
    cv: CV,
    newFormat: any,
    customFormatConfig?: any
  ): Promise<CV> {
    // Re-transform content with new format
    const updatedSummary = await FormatTransformer.transformContent({
      format: newFormat,
      customConfig: customFormatConfig,
      content: cv.summary,
      contentType: 'summary'
    });

    const updatedRole = await FormatTransformer.transformContent({
      format: newFormat,
      customConfig: customFormatConfig,
      content: cv.role,
      contentType: 'summary'
    });

    const updatedExperience = await Promise.all(
      cv.experience.map(async (role) => ({
        ...role,
        bullets: await Promise.all(
          role.bullets.map(bullet =>
            FormatTransformer.transformContent({
              format: newFormat,
              customConfig: customFormatConfig,
              content: bullet,
              contentType: 'experience'
            })
          )
        )
      }))
    );

    const updatedSkills = await Promise.all(
      cv.skills.map(skill =>
        FormatTransformer.transformContent({
          format: newFormat,
          customConfig: customFormatConfig,
          content: skill,
          contentType: 'strengths'
        })
      )
    );

    return {
      ...cv,
      role: updatedRole,
      summary: updatedSummary,
      experience: updatedExperience,
      skills: updatedSkills,
      format: newFormat,
      customFormatConfig,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Validate CV data
   */
  static validate(cv: Partial<CV>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!cv.name?.trim()) {
      errors.push('Name is required');
    }

    if (!cv.role?.trim()) {
      errors.push('Role is required');
    }

    if (!cv.summary?.trim()) {
      errors.push('Summary is required');
    }

    if (!cv.experience || cv.experience.length === 0) {
      errors.push('At least one experience entry is required');
    }

    if (!cv.skills || cv.skills.length === 0) {
      errors.push('Skills are required');
    }

    if (!cv.format) {
      errors.push('Presentation format is required');
    }

    // Validate experience entries
    cv.experience?.forEach((role, index) => {
      if (!role.role?.trim()) {
        errors.push(`Experience ${index + 1}: Role is required`);
      }
      if (!role.org?.trim()) {
        errors.push(`Experience ${index + 1}: Organization is required`);
      }
      if (!role.dates?.trim()) {
        errors.push(`Experience ${index + 1}: Dates are required`);
      }
      if (!role.bullets || role.bullets.length === 0) {
        errors.push(`Experience ${index + 1}: At least one bullet point is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a preview version with sample data
   */
  static generatePreview(format: any, customFormatConfig?: any): CV {
    return {
      name: 'John Professional',
      role: 'Senior Software Engineer',
      summary: 'Experienced software engineer with a passion for building scalable solutions and leading high-performing teams.',
      experience: [
        {
          role: 'Senior Software Engineer',
          org: 'Tech Company Inc.',
          dates: '2020 - Present',
          bullets: [
            'Led development of microservices architecture serving 1M+ users',
            'Mentored junior developers and established coding best practices',
            'Reduced system latency by 40% through performance optimizations'
          ]
        },
        {
          role: 'Software Engineer',
          org: 'Previous Tech Co.',
          dates: '2018 - 2020',
          bullets: [
            'Built responsive web applications using React and Node.js',
            'Collaborated with product team to deliver user-focused features',
            'Implemented automated testing that improved code quality'
          ]
        }
      ],
      skills: [
        'JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker',
        'Leadership', 'Problem Solving', 'Team Collaboration', 'Agile Development'
      ],
      links: [
        { label: 'LinkedIn', url: 'https://linkedin.com/in/johnprofessional' },
        { label: 'GitHub', url: 'https://github.com/johnprofessional' },
        { label: 'Portfolio', url: 'https://johnprofessional.dev' }
      ],
      format,
      customFormatConfig,
      isPublic: false
    };
  }
}