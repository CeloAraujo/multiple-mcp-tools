import * as XLSX from 'xlsx';
import { getFileExtension } from '../documents/documentUtils.ts';
import { SalesCsvParser } from './salesCsvParser.ts';
import { SalesRecordMapper, type RawSalesRecord } from './salesRecordMapper.ts';
import type { SalesRecord } from './types.ts';

export type SalesFileInput = {
    fileName: string;
    mimeType?: string;
    content: Buffer;
};

export interface SalesFileParser {
    supports(input: Pick<SalesFileInput, 'fileName' | 'mimeType'>): boolean;
    parse(input: SalesFileInput): Promise<SalesRecord[]>;
}

export class CsvSalesFileParser implements SalesFileParser {
    private readonly csvParser: SalesCsvParser;

    constructor(csvParser = new SalesCsvParser()) {
        this.csvParser = csvParser;
    }

    supports(input: Pick<SalesFileInput, 'fileName' | 'mimeType'>) {
        return getFileExtension(input.fileName) === 'csv' || input.mimeType === 'text/csv';
    }

    async parse(input: SalesFileInput) {
        return this.csvParser.parse(input.content.toString('utf-8'));
    }
}

export class SpreadsheetSalesFileParser implements SalesFileParser {
    private readonly mapper: SalesRecordMapper;

    constructor(mapper = new SalesRecordMapper()) {
        this.mapper = mapper;
    }

    supports(input: Pick<SalesFileInput, 'fileName' | 'mimeType'>) {
        const extension = getFileExtension(input.fileName);

        return ['xlsx', 'xls'].includes(extension)
            || input.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            || input.mimeType === 'application/vnd.ms-excel';
    }

    async parse(input: SalesFileInput) {
        const workbook = XLSX.read(input.content, {
            type: 'buffer',
        });
        const rows = workbook.SheetNames.flatMap((sheetName) => {
            const sheet = workbook.Sheets[sheetName];

            return XLSX.utils.sheet_to_json<RawSalesRecord>(sheet, {
                defval: '',
            });
        });

        return rows.map((row, index) => this.mapper.toSalesRecord(row, index));
    }
}

export class SalesFileParserRegistry {
    private readonly parsers: SalesFileParser[];

    constructor(parsers: SalesFileParser[]) {
        this.parsers = parsers;
    }

    getParser(input: Pick<SalesFileInput, 'fileName' | 'mimeType'>) {
        const parser = this.parsers.find((candidate) => candidate.supports(input));

        if (!parser) {
            throw new Error(`Unsupported sales file type for "${input.fileName}". Use CSV, XLSX or XLS.`);
        }

        return parser;
    }
}
