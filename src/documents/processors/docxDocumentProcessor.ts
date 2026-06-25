import mammoth from 'mammoth';
import type { DocumentExtraction, DocumentInput, DocumentProcessor } from '../types.ts';
import { getFileExtension, normalizeWhitespace } from '../documentUtils.ts';

export class DocxDocumentProcessor implements DocumentProcessor {
    readonly type = 'docx' as const;

    supports(input: Pick<DocumentInput, 'fileName' | 'mimeType'>) {
        const extension = getFileExtension(input.fileName);

        return extension === 'docx'
            || input.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    async extract(input: DocumentInput): Promise<DocumentExtraction> {
        const result = await mammoth.extractRawText({
            buffer: input.content,
        });

        return {
            fileName: input.fileName,
            mimeType: input.mimeType,
            extension: getFileExtension(input.fileName),
            type: this.type,
            text: normalizeWhitespace(result.value),
            metadata: {
                warnings: result.messages.map((message) => message.message),
            },
        };
    }
}
