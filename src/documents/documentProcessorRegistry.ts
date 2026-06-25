import type { DocumentInput, DocumentProcessor } from './types.ts';

export class DocumentProcessorRegistry {
    private readonly processors: DocumentProcessor[];

    constructor(processors: DocumentProcessor[]) {
        this.processors = processors;
    }

    getProcessor(input: Pick<DocumentInput, 'fileName' | 'mimeType'>) {
        const processor = this.processors.find((candidate) => candidate.supports(input));

        if (!processor) {
            throw new Error(`Unsupported document type for file "${input.fileName}".`);
        }

        return processor;
    }
}
