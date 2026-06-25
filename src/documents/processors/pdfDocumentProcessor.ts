import { PDFParse } from 'pdf-parse';
import type { DocumentExtraction, DocumentInput, DocumentProcessor } from '../types.ts';
import { getFileExtension, normalizeWhitespace } from '../documentUtils.ts';

export class PdfDocumentProcessor implements DocumentProcessor {
    readonly type = 'pdf' as const;

    supports(input: Pick<DocumentInput, 'fileName' | 'mimeType'>) {
        return getFileExtension(input.fileName) === 'pdf' || input.mimeType === 'application/pdf';
    }

    async extract(input: DocumentInput): Promise<DocumentExtraction> {
        const parser = new PDFParse({
            data: input.content,
        });

        try {
            const result = await parser.getText();

            return {
                fileName: input.fileName,
                mimeType: input.mimeType,
                extension: getFileExtension(input.fileName),
                type: this.type,
                text: normalizeWhitespace(result.text),
                metadata: {
                    pages: result.total,
                },
            };
        } finally {
            await parser.destroy();
        }
    }
}
