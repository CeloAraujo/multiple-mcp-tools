import { DocumentExtractionService } from './documentExtractionService.ts';
import { DocumentProcessorRegistry } from './documentProcessorRegistry.ts';
import { CsvDocumentProcessor } from './processors/csvDocumentProcessor.ts';
import { DocxDocumentProcessor } from './processors/docxDocumentProcessor.ts';
import { PdfDocumentProcessor } from './processors/pdfDocumentProcessor.ts';
import { XlsxDocumentProcessor } from './processors/xlsxDocumentProcessor.ts';

export const createDocumentExtractionService = () => {
    const registry = new DocumentProcessorRegistry([
        new CsvDocumentProcessor(),
        new DocxDocumentProcessor(),
        new PdfDocumentProcessor(),
        new XlsxDocumentProcessor(),
    ]);

    return new DocumentExtractionService(registry);
};
