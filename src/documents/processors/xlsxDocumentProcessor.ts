import * as XLSX from 'xlsx';
import type { DocumentExtraction, DocumentInput, DocumentProcessor } from '../types.ts';
import { getFileExtension, normalizeWhitespace } from '../documentUtils.ts';

export class XlsxDocumentProcessor implements DocumentProcessor {
    readonly type = 'xlsx' as const;

    supports(input: Pick<DocumentInput, 'fileName' | 'mimeType'>) {
        const extension = getFileExtension(input.fileName);

        return ['xlsx', 'xls'].includes(extension)
            || input.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            || input.mimeType === 'application/vnd.ms-excel';
    }

    async extract(input: DocumentInput): Promise<DocumentExtraction> {
        const workbook = XLSX.read(input.content, {
            type: 'buffer',
        });
        const sheets = workbook.SheetNames.map((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
                defval: '',
            });

            return {
                sheetName,
                rows,
            };
        });

        const text = sheets
            .map((sheet) => [
                `# ${sheet.sheetName}`,
                JSON.stringify(sheet.rows, null, 2),
            ].join('\n'))
            .join('\n\n');

        return {
            fileName: input.fileName,
            mimeType: input.mimeType,
            extension: getFileExtension(input.fileName),
            type: this.type,
            text: normalizeWhitespace(text),
            metadata: {
                sheets: sheets.map((sheet) => ({
                    name: sheet.sheetName,
                    rows: sheet.rows.length,
                })),
            },
        };
    }
}
