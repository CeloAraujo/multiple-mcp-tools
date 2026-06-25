import { buildGraph } from '../graph/factory.ts';
import { SalesAutomationService } from '../sales/salesAutomationService.ts';
import { createDocumentExtractionService } from '../documents/documentContainer.ts';
import type { DocumentExtractionService } from '../documents/documentExtractionService.ts';

export type ApplicationContainer = {
    graph: Awaited<ReturnType<typeof buildGraph>>;
    salesAutomationService: SalesAutomationService;
    documentExtractionService: DocumentExtractionService;
};

export const createApplicationContainer = async (): Promise<ApplicationContainer> => ({
    graph: await buildGraph(),
    salesAutomationService: new SalesAutomationService(),
    documentExtractionService: createDocumentExtractionService(),
});
