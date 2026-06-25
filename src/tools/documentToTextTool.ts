import { tool } from '@langchain/core/tools';
import { z } from 'zod/v3';
import { createDocumentExtractionService } from '../documents/documentContainer.ts';

export function getDocumentToTextTool() {
    const documentExtractionService = createDocumentExtractionService();

    return tool(
        async ({ fileName, contentBase64, mimeType }) => {
            const document = await documentExtractionService.extract({
                fileName,
                contentBase64,
                mimeType,
            });

            return JSON.stringify(document);
        },
        {
            name: 'document_to_text',
            description: 'Extract text and metadata from CSV, PDF, DOCX, XLSX or XLS files encoded as base64.',
            schema: z.object({
                fileName: z.string().describe('Original file name, including extension.'),
                contentBase64: z.string().describe('Base64-encoded file content. Data URLs are accepted.'),
                mimeType: z.string().optional().describe('Optional MIME type for the file.'),
            }),
        },
    );
}
