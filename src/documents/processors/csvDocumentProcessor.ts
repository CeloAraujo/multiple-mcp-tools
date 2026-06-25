import csvtojson from 'csvtojson';
import type { DocumentExtraction, DocumentInput, DocumentProcessor } from '../types.ts';
import { getFileExtension, normalizeWhitespace } from '../documentUtils.ts';

export class CsvDocumentProcessor implements DocumentProcessor {
    readonly type = 'csv' as const;

    supports(input: Pick<DocumentInput, 'fileName' | 'mimeType'>) {
        return getFileExtension(input.fileName) === 'csv' || input.mimeType === 'text/csv';
    }

    async extract(input: DocumentInput): Promise<DocumentExtraction> {
        const csv = input.content.toString('utf-8');
        const rows = await csvtojson().fromString(csv);

        return {
            fileName: input.fileName,
            mimeType: input.mimeType,
            extension: getFileExtension(input.fileName),
            type: this.type,
            text: normalizeWhitespace(JSON.stringify(rows, null, 2)),
            metadata: {
                rows: rows.length,
                columns: rows.at(0) ? Object.keys(rows[0]).length : 0,
            },
        };
    }
}
