import { loadPdfExportTools } from '../pdf-export';
import type { BrandRider, CV } from '../generators/types';

export interface PDFExportOptions {
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  quality?: number;
  filename?: string;
}

export interface PDFExportResult {
  blob: Blob;
  url: string;
  filename: string;
}

export class PDFExporter {
  private static readonly DEFAULT_OPTIONS: Required<PDFExportOptions> = {
    format: 'a4',
    orientation: 'portrait',
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
    quality: 1.0,
    filename: 'document.pdf',
  };

  /**
   * Export a Brand Rider document to PDF
   */
  static async exportBrandRider(
    brandRider: BrandRider,
    options: PDFExportOptions = {}
  ): Promise<PDFExportResult> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const htmlContent = this.generateBrandRiderHTML(brandRider);
    
    return this.generatePDF(htmlContent, {
      ...mergedOptions,
      filename: mergedOptions.filename || `${brandRider.title.toLowerCase().replace(/\s+/g, '-')}-brand-rider.pdf`,
    });
  }

  /**
   * Export a CV document to PDF
   */
  static async exportCV(
    cv: CV,
    options: PDFExportOptions = {}
  ): Promise<PDFExportResult> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const htmlContent = this.generateCVHTML(cv);
    
    return this.generatePDF(htmlContent, {
      ...mergedOptions,
      filename: mergedOptions.filename || `${cv.name.toLowerCase().replace(/\s+/g, '-')}-cv.pdf`,
    });
  }

  /**
   * Export custom HTML content to PDF
   */
  static async exportHTML(
    htmlContent: string,
    options: PDFExportOptions = {}
  ): Promise<PDFExportResult> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    return this.generatePDF(htmlContent, mergedOptions);
  }

  /**
   * Generate PDF from HTML content
   */
  private static async generatePDF(
    htmlContent: string,
    options: Required<PDFExportOptions>
  ): Promise<PDFExportResult> {
    try {
      const { jsPDF } = await loadPdfExportTools();
      
      // Create a temporary container for the HTML content
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '210mm'; // A4 width
      container.style.backgroundColor = 'white';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.fontSize = '12px';
      container.style.lineHeight = '1.4';
      container.style.color = '#000000';
      
      document.body.appendChild(container);

      try {
        // Create PDF instance
        const pdf = new jsPDF({
          orientation: options.orientation,
          unit: 'mm',
          format: options.format,
        });

        // Get page dimensions
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const contentWidth = pageWidth - options.margins.left - options.margins.right;
        const contentHeight = pageHeight - options.margins.top - options.margins.bottom;

        // Add content to PDF
        await this.addHTMLToPDF(pdf, container, {
          x: options.margins.left,
          y: options.margins.top,
          width: contentWidth,
          height: contentHeight,
        });

        // Generate blob and URL
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);

        return {
          blob: pdfBlob,
          url,
          filename: options.filename,
        };
      } finally {
        // Clean up temporary container
        document.body.removeChild(container);
      }
    } catch (error) {
      throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add HTML content to PDF using text-based approach
   */
  private static async addHTMLToPDF(
    pdf: any,
    container: HTMLElement,
    bounds: { x: number; y: number; width: number; height: number }
  ): Promise<void> {
    // Extract text content and basic formatting
    const textContent = this.extractTextContent(container);
    
    let currentY = bounds.y;
    const lineHeight = 6; // mm
    const maxWidth = bounds.width;

    for (const line of textContent) {
      if (currentY + lineHeight > bounds.y + bounds.height) {
        pdf.addPage();
        currentY = bounds.y;
      }

      // Handle different text styles
      if (line.type === 'heading') {
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
      } else if (line.type === 'subheading') {
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
      } else {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
      }

      // Split long lines
      const splitText = pdf.splitTextToSize(line.text, maxWidth);
      
      for (const textLine of splitText) {
        if (currentY + lineHeight > bounds.y + bounds.height) {
          pdf.addPage();
          currentY = bounds.y;
        }
        
        pdf.text(textLine, bounds.x, currentY);
        currentY += lineHeight;
      }

      // Add extra spacing after headings
      if (line.type === 'heading' || line.type === 'subheading') {
        currentY += 3;
      }
    }
  }

  /**
   * Extract text content with basic formatting information
   */
  private static extractTextContent(container: HTMLElement): Array<{ text: string; type: string }> {
    const content: Array<{ text: string; type: string }> = [];
    
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          content.push({ text, type: 'text' });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        
        if (tagName === 'h1') {
          const text = element.textContent?.trim();
          if (text) content.push({ text, type: 'heading' });
        } else if (tagName === 'h2' || tagName === 'h3') {
          const text = element.textContent?.trim();
          if (text) content.push({ text, type: 'subheading' });
        } else if (tagName === 'p' || tagName === 'div') {
          const text = element.textContent?.trim();
          if (text) content.push({ text, type: 'text' });
        } else if (tagName === 'ul' || tagName === 'ol') {
          const items = element.querySelectorAll('li');
          items.forEach((item, index) => {
            const text = item.textContent?.trim();
            if (text) {
              const bullet = tagName === 'ul' ? '• ' : `${index + 1}. `;
              content.push({ text: bullet + text, type: 'text' });
            }
          });
        } else {
          // Process child nodes
          for (const child of node.childNodes) {
            processNode(child);
          }
        }
      }
    };

    processNode(container);
    return content;
  }

  /**
   * Generate HTML content for Brand Rider
   */
  private static generateBrandRiderHTML(brandRider: BrandRider): string {
    const colorSwatches = brandRider.palette
      .map(color => `<span style="display: inline-block; width: 20px; height: 20px; background-color: ${color.hex}; margin-right: 8px; border: 1px solid #ccc;"></span>${color.name} (${color.hex})`)
      .join('<br>');

    return `
      <div style="max-width: 210mm; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="font-size: 24px; margin-bottom: 10px; color: #333;">${brandRider.title}</h1>
        <p style="font-size: 16px; font-style: italic; margin-bottom: 20px; color: #666;">${brandRider.tagline}</p>
        
        <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Voice & Tone</h2>
        <p style="margin-bottom: 15px;">${brandRider.voiceTone.join(', ')}</p>
        
        <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Signature Phrases</h2>
        <ul style="margin-bottom: 15px;">
          ${brandRider.signaturePhrases.map(phrase => `<li style="margin-bottom: 5px;">"${phrase}"</li>`).join('')}
        </ul>
        
        <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Strengths</h2>
        <ul style="margin-bottom: 15px;">
          ${brandRider.strengths.map(strength => `<li style="margin-bottom: 5px;">${strength}</li>`).join('')}
        </ul>
        
        <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Areas for Growth</h2>
        <ul style="margin-bottom: 15px;">
          ${brandRider.weaknesses.map(weakness => `<li style="margin-bottom: 5px;">${weakness}</li>`).join('')}
        </ul>
        
        <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Color Palette</h2>
        <div style="margin-bottom: 15px; line-height: 1.8;">
          ${colorSwatches}
        </div>
        
        <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Typography</h2>
        <p style="margin-bottom: 5px;"><strong>Heading Font:</strong> ${brandRider.fonts.heading}</p>
        <p style="margin-bottom: 15px;"><strong>Body Font:</strong> ${brandRider.fonts.body}</p>
        
        <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Bio</h2>
        <p style="margin-bottom: 15px; line-height: 1.6;">${brandRider.bio}</p>
        
        ${brandRider.examples && brandRider.examples.length > 0 ? `
          <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Usage Examples</h2>
          ${brandRider.examples.map(example => `
            <div style="margin-bottom: 15px; padding: 10px; background-color: #f5f5f5; border-left: 3px solid #333;">
              <h3 style="font-size: 14px; margin-bottom: 5px;">${example.context}</h3>
              <p style="font-style: italic;">"${example.example}"</p>
            </div>
          `).join('')}
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate HTML content for CV
   */
  private static generateCVHTML(cv: CV): string {
    const experienceHTML = cv.experience
      .map(role => `
        <div style="margin-bottom: 15px;">
          <h3 style="font-size: 14px; margin-bottom: 5px; color: #333;">${role.role} at ${role.org}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${role.dates}</p>
          <ul style="margin-left: 20px;">
            ${role.bullets.map(bullet => `<li style="margin-bottom: 3px; font-size: 12px;">${bullet}</li>`).join('')}
          </ul>
        </div>
      `).join('');

    const linksHTML = cv.links
      .map(link => `<span style="margin-right: 15px;">${link.label}: ${link.url}</span>`)
      .join('');

    return `
      <div style="max-width: 210mm; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="font-size: 24px; margin-bottom: 5px; color: #333;">${cv.name}</h1>
        <h2 style="font-size: 16px; margin-bottom: 15px; color: #666; font-weight: normal;">${cv.role}</h2>
        
        <h3 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Summary</h3>
        <p style="margin-bottom: 20px; line-height: 1.6;">${cv.summary}</p>
        
        <h3 style="font-size: 18px; margin-top: 20px; margin-bottom: 15px; color: #333;">Experience</h3>
        ${experienceHTML}
        
        <h3 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Skills</h3>
        <p style="margin-bottom: 20px;">${cv.skills.join(', ')}</p>
        
        ${cv.links && cv.links.length > 0 ? `
          <h3 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Links</h3>
          <div style="font-size: 12px; line-height: 1.8;">
            ${linksHTML}
          </div>
        ` : ''}
      </div>
    `;
  }
}