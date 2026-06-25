import { decodeBase64 } from './documentUtils.ts';
import type { DocumentExtractionRequest } from './types.ts';
import { DocumentProcessorRegistry } from './documentProcessorRegistry.ts';

export class DocumentExtractionService {
    private readonly registry: DocumentProcessorRegistry;

    constructor(registry: DocumentProcessorRegistry) {
        this.registry = registry;
    }

    async extract(request: DocumentExtractionRequest) {
        if (!request.fileName?.trim()) {
            throw new Error('fileName is required.');
        }

        if (!request.contentBase64?.trim()) {
            throw new Error('contentBase64 is required.');
        }

        const input = {
            fileName: request.fileName,
            mimeType: request.mimeType,
            content: decodeBase64(request.contentBase64),
        };
        const processor = this.registry.getProcessor(input);

        return processor.extract(input);
    }
}
