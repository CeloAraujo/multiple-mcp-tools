export type SupportedDocumentType = 'csv' | 'docx' | 'pdf' | 'xlsx';

export type DocumentInput = {
    fileName: string;
    content: Buffer;
    mimeType?: string;
};

export type DocumentExtraction = {
    fileName: string;
    mimeType?: string;
    extension: string;
    type: SupportedDocumentType;
    text: string;
    metadata: Record<string, unknown>;
};

export type DocumentExtractionRequest = {
    fileName: string;
    contentBase64: string;
    mimeType?: string;
};

export interface DocumentProcessor {
    readonly type: SupportedDocumentType;
    supports(input: Pick<DocumentInput, 'fileName' | 'mimeType'>): boolean;
    extract(input: DocumentInput): Promise<DocumentExtraction>;
}
