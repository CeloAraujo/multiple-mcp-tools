import { buildGraph } from '../graph/factory.ts';
import { SalesAutomationService } from '../sales/salesAutomationService.ts';
import { CsvSalesFileParser, DocumentSalesFileParser, SalesFileParserRegistry, SpreadsheetSalesFileParser } from '../sales/salesFileParsers.ts';
import { createDocumentExtractionService } from '../documents/documentContainer.ts';
import type { DocumentExtractionService } from '../documents/documentExtractionService.ts';

export type ApplicationContainer = {
    graph: Awaited<ReturnType<typeof buildGraph>>;
    salesAutomationService: SalesAutomationService;
    documentExtractionService: DocumentExtractionService;
};

export const createApplicationContainer = async (): Promise<ApplicationContainer> => ({
    graph: await buildGraph(),
    ...createServices(),
});

const createServices = () => {
    const documentExtractionService = createDocumentExtractionService();
    const salesFileParserRegistry = new SalesFileParserRegistry([
        new CsvSalesFileParser(),
        new SpreadsheetSalesFileParser(),
        new DocumentSalesFileParser(documentExtractionService),
    ]);

    return {
        salesAutomationService: new SalesAutomationService({
            fileParserRegistry: salesFileParserRegistry,
        }),
        documentExtractionService,
    };
};
