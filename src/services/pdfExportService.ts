import { Order, OrderFile, FileStage, CustomerData, DocumentTemplate } from '../types';
import { storageService } from './storage';

export const pdfExportService = {
  /**
   * Generates standard file name:
   * Format: [Customer_Name]_[Product_Type]_[Stage]_[Version].[ext]
   * Example: Andi_Saputra_CV_ATS_Final.pdf or ORD-2025-001289_Andi_Saputra_CV_ATS_Final_V1.pdf
   */
  generateStandardFileName(
    orderId: string,
    customerName: string,
    productType: string,
    stage: FileStage,
    version: number = 1,
    ext: 'pdf' | 'docx' | 'png' | 'zip' = 'pdf',
    includeOrderId: boolean = true
  ): string {
    const cleanName = (customerName || 'Pelanggan')
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_');

    let cleanProduct = 'CV_ATS';
    if (productType.includes('Kreatif')) cleanProduct = 'CV_Kreatif';
    else if (productType.includes('Paket Komplit')) cleanProduct = 'Paket_Komplit';
    else if (productType.includes('Portfolio')) cleanProduct = 'Portfolio';
    else if (productType.includes('Cover Letter')) cleanProduct = 'Cover_Letter';
    else if (productType.includes('LinkedIn')) cleanProduct = 'LinkedIn_Bio';
    else if (productType.includes('Executive')) cleanProduct = 'Executive_Resume';

    const stageLabel = stage === 'Final' ? 'Final' : stage === 'Preview' ? 'Preview' : stage === 'Revision' ? `Rev_V${version}` : `Draft_V${version}`;

    if (includeOrderId && orderId) {
      return `${orderId}_${cleanName}_${cleanProduct}_${stageLabel}.${ext}`;
    }

    return `${cleanName}_${cleanProduct}_${stageLabel}.${ext}`;
  },

  /**
   * Triggers browser print dialog for native PDF generation with A4 CSS isolation
   */
  triggerPrint(documentTitle?: string): void {
    const originalTitle = document.title;
    if (documentTitle) {
      document.title = documentTitle;
    }

    window.print();

    // Restore original title after print dialog closes
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  },

  /**
   * Simulates PDF blob generation & file download with client notifications
   */
  downloadDocument(fileName: string, mimeType: string = 'application/pdf'): void {
    // In browser client-side, we generate a mock structured payload blob
    const blob = new Blob([`Arise Career Craft - Generated PDF Export: ${fileName}`], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Register a new file to an order and persist in storage
   */
  registerGeneratedFile(
    orderId: string,
    customerName: string,
    productType: string,
    stage: FileStage,
    version: number,
    fileSize: string = '348 KB',
    fileType: 'pdf' | 'docx' | 'png' | 'zip' = 'pdf'
  ): OrderFile {
    const fileName = this.generateStandardFileName(
      orderId,
      customerName,
      productType,
      stage,
      version,
      fileType
    );

    const newFile: OrderFile = {
      id: `FIL-${Date.now()}`,
      fileName,
      stage,
      version,
      uploadedAt: new Date().toISOString(),
      fileSize,
      fileType
    };

    storageService.addFileToOrder(orderId, newFile);
    return newFile;
  }
};
