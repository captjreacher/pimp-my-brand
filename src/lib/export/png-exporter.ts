import { loadPdfExportTools } from '../pdf-export';
import type { BrandRider, CV } from '../generators/types';

export interface PNGExportOptions {
  width?: number;
  height?: number;
  quality?: number;
  backgroundColor?: string;
  scale?: number;
  filename?: string;
  format?: 'png' | 'jpeg' | 'webp';
}

export interface PNGExportResult {
  blob: Blob;
  url: string;
  filename: string;
  width: number;
  height: number;
}

export class PNGExporter {
  private static readonly DEFAULT_OPTIONS: Required<PNGExportOptions> = {
    width: 1200,
    height: 630, // Standard social media image size
    quality: 0.95,
    backgroundColor: '#ffffff',
    scale: 2, // For high DPI displays
    filename: 'image.png',
    format: 'png',
  };

  /**
   * Export Brand Rider hero section as PNG
   */
  static async exportBrandRiderHero(
    brandRider: BrandRider,
    options: PNGExportOptions = {}
  ): Promise<PNGExportResult> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const heroHTML = this.generateBrandRiderHeroHTML(brandRider);
    
    return this.generatePNG(heroHTML, {
      ...mergedOptions,
      filename: mergedOptions.filename || `${brandRider.title.toLowerCase().replace(/\s+/g, '-')}-hero.png`,
    });
  }

  /**
   * Export CV hero section as PNG
   */
  static async exportCVHero(
    cv: CV,
    options: PNGExportOptions = {}
  ): Promise<PNGExportResult> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const heroHTML = this.generateCVHeroHTML(cv);
    
    return this.generatePNG(heroHTML, {
      ...mergedOptions,
      filename: mergedOptions.filename || `${cv.name.toLowerCase().replace(/\s+/g, '-')}-hero.png`,
    });
  }

  /**
   * Export custom HTML element as PNG
   */
  static async exportElement(
    element: HTMLElement,
    options: PNGExportOptions = {}
  ): Promise<PNGExportResult> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      const { html2canvas } = await loadPdfExportTools();
      
      const canvas = await html2canvas(element, {
        width: mergedOptions.width,
        height: mergedOptions.height,
        scale: mergedOptions.scale,
        backgroundColor: mergedOptions.backgroundColor,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      return this.canvasToResult(canvas, mergedOptions);
    } catch (error) {
      throw new Error(`PNG export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export HTML content as PNG
   */
  static async exportHTML(
    htmlContent: string,
    options: PNGExportOptions = {}
  ): Promise<PNGExportResult> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    return this.generatePNG(htmlContent, mergedOptions);
  }

  /**
   * Generate PNG from HTML content
   */
  private static async generatePNG(
    htmlContent: string,
    options: Required<PNGExportOptions>
  ): Promise<PNGExportResult> {
    try {
      const { html2canvas } = await loadPdfExportTools();
      
      // Create a temporary container for the HTML content
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = `${options.width}px`;
      container.style.height = `${options.height}px`;
      container.style.backgroundColor = options.backgroundColor;
      container.style.overflow = 'hidden';
      
      document.body.appendChild(container);

      try {
        const canvas = await html2canvas(container, {
          width: options.width,
          height: options.height,
          scale: options.scale,
          backgroundColor: options.backgroundColor,
          useCORS: true,
          allowTaint: false,
          logging: false,
        });

        return this.canvasToResult(canvas, options);
      } finally {
        // Clean up temporary container
        document.body.removeChild(container);
      }
    } catch (error) {
      throw new Error(`PNG export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert canvas to export result
   */
  private static canvasToResult(
    canvas: HTMLCanvasElement,
    options: Required<PNGExportOptions>
  ): Promise<PNGExportResult> {
    return new Promise((resolve, reject) => {
      const mimeType = this.getMimeType(options.format);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to generate image blob'));
            return;
          }

          const url = URL.createObjectURL(blob);
          
          resolve({
            blob,
            url,
            filename: options.filename,
            width: canvas.width,
            height: canvas.height,
          });
        },
        mimeType,
        options.quality
      );
    });
  }

  /**
   * Get MIME type for format
   */
  private static getMimeType(format: PNGExportOptions['format']): string {
    switch (format) {
      case 'jpeg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      case 'png':
      default:
        return 'image/png';
    }
  }

  /**
   * Generate hero HTML for Brand Rider
   */
  private static generateBrandRiderHeroHTML(brandRider: BrandRider): string {
    const primaryColor = brandRider.palette[0]?.hex || '#333333';
    const secondaryColor = brandRider.palette[1]?.hex || '#666666';
    
    return `
      <div style="
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20);
        font-family: '${brandRider.fonts.heading}', Arial, sans-serif;
        text-align: center;
        padding: 60px 40px;
        box-sizing: border-box;
      ">
        <h1 style="
          font-size: 48px;
          font-weight: bold;
          color: ${primaryColor};
          margin: 0 0 20px 0;
          line-height: 1.2;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">${brandRider.title}</h1>
        
        <p style="
          font-size: 24px;
          color: ${secondaryColor};
          margin: 0 0 30px 0;
          font-style: italic;
          font-family: '${brandRider.fonts.body}', Arial, sans-serif;
        ">${brandRider.tagline}</p>
        
        <div style="
          display: flex;
          gap: 15px;
          margin-bottom: 30px;
          flex-wrap: wrap;
          justify-content: center;
        ">
          ${brandRider.palette.slice(0, 5).map(color => `
            <div style="
              width: 40px;
              height: 40px;
              background-color: ${color.hex};
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            "></div>
          `).join('')}
        </div>
        
        <div style="
          background: rgba(255,255,255,0.9);
          padding: 20px 30px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          max-width: 80%;
        ">
          <p style="
            font-size: 18px;
            color: #333;
            margin: 0;
            line-height: 1.4;
            font-family: '${brandRider.fonts.body}', Arial, sans-serif;
          ">${brandRider.voiceTone.slice(0, 3).join(' • ')}</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate hero HTML for CV
   */
  private static generateCVHeroHTML(cv: CV): string {
    return `
      <div style="
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #f8fafc, #e2e8f0);
        font-family: 'Inter', Arial, sans-serif;
        text-align: center;
        padding: 60px 40px;
        box-sizing: border-box;
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          max-width: 90%;
          width: 100%;
        ">
          <h1 style="
            font-size: 42px;
            font-weight: bold;
            color: #1e293b;
            margin: 0 0 10px 0;
            line-height: 1.2;
          ">${cv.name}</h1>
          
          <h2 style="
            font-size: 24px;
            color: #64748b;
            margin: 0 0 25px 0;
            font-weight: normal;
          ">${cv.role}</h2>
          
          <p style="
            font-size: 16px;
            color: #475569;
            margin: 0 0 25px 0;
            line-height: 1.6;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          ">${cv.summary}</p>
          
          <div style="
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 20px;
          ">
            ${cv.skills.slice(0, 6).map(skill => `
              <span style="
                background: #e2e8f0;
                color: #475569;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
              ">${skill}</span>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create social media optimized images
   */
  static async createSocialMediaImage(
    content: { title: string; subtitle?: string; colors: string[] },
    platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook' = 'twitter',
    options: Partial<PNGExportOptions> = {}
  ): Promise<PNGExportResult> {
    const dimensions = this.getSocialMediaDimensions(platform);
    const mergedOptions = { 
      ...this.DEFAULT_OPTIONS, 
      ...dimensions,
      ...options,
      filename: options.filename || `${content.title.toLowerCase().replace(/\s+/g, '-')}-${platform}.png`,
    };

    const socialHTML = this.generateSocialMediaHTML(content, platform);
    return this.generatePNG(socialHTML, mergedOptions);
  }

  /**
   * Get platform-specific dimensions
   */
  private static getSocialMediaDimensions(platform: string): { width: number; height: number } {
    switch (platform) {
      case 'twitter':
        return { width: 1200, height: 675 };
      case 'linkedin':
        return { width: 1200, height: 627 };
      case 'instagram':
        return { width: 1080, height: 1080 };
      case 'facebook':
        return { width: 1200, height: 630 };
      default:
        return { width: 1200, height: 630 };
    }
  }

  /**
   * Generate social media optimized HTML
   */
  private static generateSocialMediaHTML(
    content: { title: string; subtitle?: string; colors: string[] },
    platform: string
  ): string {
    const primaryColor = content.colors[0] || '#333333';
    const secondaryColor = content.colors[1] || '#666666';
    
    return `
      <div style="
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15);
        font-family: 'Inter', Arial, sans-serif;
        text-align: center;
        padding: 40px;
        box-sizing: border-box;
        position: relative;
      ">
        <div style="
          background: rgba(255,255,255,0.95);
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          max-width: 80%;
          backdrop-filter: blur(10px);
        ">
          <h1 style="
            font-size: ${platform === 'instagram' ? '36px' : '42px'};
            font-weight: bold;
            color: ${primaryColor};
            margin: 0 0 ${content.subtitle ? '15px' : '0'} 0;
            line-height: 1.2;
          ">${content.title}</h1>
          
          ${content.subtitle ? `
            <p style="
              font-size: ${platform === 'instagram' ? '18px' : '20px'};
              color: ${secondaryColor};
              margin: 0;
              line-height: 1.4;
            ">${content.subtitle}</p>
          ` : ''}
        </div>
        
        <div style="
          position: absolute;
          bottom: 20px;
          right: 20px;
          display: flex;
          gap: 8px;
        ">
          ${content.colors.slice(0, 4).map(color => `
            <div style="
              width: 20px;
              height: 20px;
              background-color: ${color};
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            "></div>
          `).join('')}
        </div>
      </div>
    `;
  }
}