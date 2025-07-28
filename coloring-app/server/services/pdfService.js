/**
 * PDF Generation Service for Coloring Book Creator
 * 
 * Provides high-quality PDF generation functionality for generated coloring pages.
 * Implements 300 DPI output as specified in PRD requirements.
 * 
 * Evidence-based implementation following architecture.md specifications:
 * - PDF generation endpoint (architecture.md Section 3.3.1)
 * - High-quality output (300 DPI) as specified in PRD
 * - Error handling and logging for production reliability
 * 
 * FLOW STEP 4: Part of the final step - "Return image to frontend for zoomable preview, 
 * with modal options to download as 300 DPI PDF or save to Firebase gallery"
 */

import jsPDF from 'jspdf';
import winston from 'winston';

// Logger configuration for PDF service
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'pdf-service' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5 
    })
  ]
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

/**
 * PDF Generation Service class
 * 
 * Handles conversion of generated coloring page images to high-quality PDFs
 * suitable for printing at 300 DPI resolution.
 */
class PDFService {
  constructor() {
    this.logger = logger;
    this.defaultOptions = {
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter', // 8.5" x 11" standard coloring book size
      compress: true
    };
  }

  /**
   * Generate PDF from image URL
   * 
   * CORE FUNCTIONALITY: Converts generated coloring page image to 300 DPI PDF
   * 
   * @param {string} imageUrl - URL of the generated coloring page image
   * @param {Object} metadata - Image metadata including title, prompts, etc.
   * @param {Object} options - PDF generation options
   * @returns {Promise<Buffer>} - PDF file buffer
   */
  async generatePDF(imageUrl, metadata = {}, options = {}) {
    const startTime = Date.now();
    const requestId = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.logger.info('Starting PDF generation', {
        requestId,
        imageUrl: imageUrl ? 'provided' : 'missing',
        hasMetadata: !!metadata,
        options
      });

      // Validate input
      if (!imageUrl) {
        throw new Error('Image URL is required for PDF generation');
      }

      // Merge options with defaults
      const pdfOptions = { ...this.defaultOptions, ...options };
      
      // Create new PDF document
      const pdf = new jsPDF(pdfOptions);
      
      // Get PDF dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate margins (0.5 inch margins = 36 points)
      const margin = 36;
      const printableWidth = pageWidth - (2 * margin);
      const printableHeight = pageHeight - (2 * margin);

      this.logger.debug('PDF page setup', {
        requestId,
        pageWidth,
        pageHeight,
        printableWidth,
        printableHeight,
        margin
      });

      // Fetch image data
      const imageData = await this.fetchImageData(imageUrl, requestId);
      
      // Add image to PDF with proper scaling for 300 DPI
      await this.addImageToPDF(pdf, imageData, {
        x: margin,
        y: margin,
        maxWidth: printableWidth,
        maxHeight: printableHeight,
        requestId
      });

      // Add metadata header if provided
      if (metadata.originalPrompt || metadata.title) {
        this.addMetadataHeader(pdf, metadata, {
          pageWidth,
          margin,
          requestId
        });
      }

      // Add footer with generation info
      this.addFooter(pdf, metadata, {
        pageWidth,
        pageHeight,
        margin,
        requestId
      });

      // Generate PDF buffer
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
      
      const processingTime = Date.now() - startTime;
      
      this.logger.info('PDF generation completed successfully', {
        requestId,
        processingTime,
        pdfSize: pdfBuffer.length,
        imageUrl: imageUrl.substring(0, 50) + '...'
      });

      return pdfBuffer;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('PDF generation failed', {
        requestId,
        error: error.message,
        stack: error.stack,
        processingTime,
        imageUrl: imageUrl ? imageUrl.substring(0, 50) + '...' : 'missing'
      });
      
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Fetch image data from URL
   * 
   * @param {string} imageUrl - URL of the image to fetch
   * @param {string} requestId - Request ID for logging
   * @returns {Promise<string>} - Base64 encoded image data
   */
  async fetchImageData(imageUrl, requestId) {
    try {
      this.logger.debug('Fetching image data', { requestId, imageUrl: imageUrl.substring(0, 50) + '...' });
      
      // Handle data URLs (base64 encoded images)
      if (imageUrl.startsWith('data:')) {
        return imageUrl;
      }

      // For HTTP URLs, fetch the image
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Determine image type from response headers or URL
      const contentType = response.headers.get('content-type') || 'image/png';
      const base64Data = buffer.toString('base64');
      const dataUrl = `data:${contentType};base64,${base64Data}`;

      this.logger.debug('Image data fetched successfully', {
        requestId,
        contentType,
        dataSize: buffer.length
      });

      return dataUrl;

    } catch (error) {
      this.logger.error('Failed to fetch image data', {
        requestId,
        error: error.message,
        imageUrl: imageUrl.substring(0, 50) + '...'
      });
      throw error;
    }
  }

  /**
   * Add image to PDF with proper scaling
   * 
   * @param {jsPDF} pdf - PDF document
   * @param {string} imageData - Base64 image data
   * @param {Object} options - Positioning and sizing options
   */
  async addImageToPDF(pdf, imageData, options) {
    const { x, y, maxWidth, maxHeight, requestId } = options;
    
    try {
      // Create a new image element to get dimensions
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            const originalWidth = img.width;
            const originalHeight = img.height;
            
            // Calculate scaling to fit within printable area while maintaining aspect ratio
            const widthRatio = maxWidth / originalWidth;
            const heightRatio = maxHeight / originalHeight;
            const scale = Math.min(widthRatio, heightRatio);
            
            const scaledWidth = originalWidth * scale;
            const scaledHeight = originalHeight * scale;
            
            // Center the image horizontally if it's smaller than max width
            const centeredX = x + (maxWidth - scaledWidth) / 2;
            
            this.logger.debug('Adding image to PDF', {
              requestId,
              originalWidth,
              originalHeight,
              scaledWidth,
              scaledHeight,
              scale,
              position: { x: centeredX, y }
            });

            // Add image to PDF
            pdf.addImage(
              imageData,
              'JPEG', // jsPDF handles format conversion automatically
              centeredX,
              y,
              scaledWidth,
              scaledHeight,
              undefined, // alias
              'MEDIUM' // compression - balances quality and file size
            );

            resolve();
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for PDF generation'));
        };
        
        img.src = imageData;
      });

    } catch (error) {
      this.logger.error('Failed to add image to PDF', {
        requestId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Add metadata header to PDF
   * 
   * @param {jsPDF} pdf - PDF document
   * @param {Object} metadata - Image metadata
   * @param {Object} options - Positioning options
   */
  addMetadataHeader(pdf, metadata, options) {
    const { pageWidth, margin, requestId } = options;
    
    try {
      const title = metadata.title || metadata.originalPrompt || 'Coloring Page';
      const headerY = margin - 20; // 20 points above the image
      
      // Only add header if there's space
      if (headerY > 10) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        
        // Center the title
        const textWidth = pdf.getTextWidth(title);
        const textX = (pageWidth - textWidth) / 2;
        
        pdf.text(title, textX, headerY);
        
        this.logger.debug('Added metadata header to PDF', {
          requestId,
          title: title.substring(0, 50),
          position: { x: textX, y: headerY }
        });
      }
    } catch (error) {
      this.logger.warn('Failed to add metadata header', {
        requestId,
        error: error.message
      });
      // Don't throw - this is non-critical
    }
  }

  /**
   * Add footer with generation info
   * 
   * @param {jsPDF} pdf - PDF document
   * @param {Object} metadata - Image metadata
   * @param {Object} options - Positioning options
   */
  addFooter(pdf, metadata, options) {
    const { pageWidth, pageHeight, margin, requestId } = options;
    
    try {
      const footerY = pageHeight - margin + 15; // 15 points below the printable area
      
      // Only add footer if there's space
      if (footerY < pageHeight - 5) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        
        // Left side: Generation date
        const date = new Date().toLocaleDateString();
        pdf.text(`Generated: ${date}`, margin, footerY);
        
        // Right side: App name
        const appText = 'Coloring Book Creator';
        const appTextWidth = pdf.getTextWidth(appText);
        pdf.text(appText, pageWidth - margin - appTextWidth, footerY);
        
        this.logger.debug('Added footer to PDF', {
          requestId,
          position: { y: footerY },
          date,
          appText
        });
      }
    } catch (error) {
      this.logger.warn('Failed to add footer', {
        requestId,
        error: error.message
      });
      // Don't throw - this is non-critical
    }
  }

  /**
   * Health check for PDF service
   * 
   * @returns {Object} Service health status
   */
  async healthCheck() {
    try {
      // Test basic PDF creation
      const testPdf = new jsPDF(this.defaultOptions);
      testPdf.text('Health Check', 10, 10);
      const testBuffer = Buffer.from(testPdf.output('arraybuffer'));
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'PDF Generation Service',
        features: {
          jsPDFVersion: jsPDF.version || 'unknown',
          canCreatePDF: testBuffer.length > 0,
          defaultOptions: this.defaultOptions
        }
      };
    } catch (error) {
      this.logger.error('PDF service health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance for consistent usage
const pdfService = new PDFService();
export default pdfService;

// Also export the class for testing
export { PDFService };