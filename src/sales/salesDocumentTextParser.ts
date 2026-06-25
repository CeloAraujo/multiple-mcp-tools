import { SalesRecordMapper, type RawSalesRecord } from './salesRecordMapper.ts';
import type { SalesRecord } from './types.ts';

type HeaderIndex = {
    id: number;
    product: number;
    price: number;
    date: number;
};

export class SalesDocumentTextParser {
    private readonly mapper: SalesRecordMapper;

    constructor(mapper = new SalesRecordMapper()) {
        this.mapper = mapper;
    }

    parse(text: string): SalesRecord[] {
        const lines = text
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);
        const headerLineIndex = lines.findIndex((line) => this.tryGetHeaderIndex(this.splitLine(line)));

        if (headerLineIndex < 0) {
            throw new Error('Could not find a sales table header. Expected columns: id, product, price and date.');
        }

        const header = this.tryGetHeaderIndex(this.splitLine(lines[headerLineIndex]));

        if (!header) {
            throw new Error('Invalid sales table header. Expected columns: id, product, price and date.');
        }

        const records = lines
            .slice(headerLineIndex + 1)
            .map((line) => this.toRawSalesRecord(line, header))
            .filter((row): row is RawSalesRecord => row !== undefined)
            .map((row, index) => this.mapper.toSalesRecord(row, index));

        if (records.length === 0) {
            throw new Error('No sales rows were found after the sales table header.');
        }

        return records;
    }

    private toRawSalesRecord(line: string, header: HeaderIndex): RawSalesRecord | undefined {
        const columns = this.splitLine(line);
        const row = {
            id: columns[header.id],
            product: columns[header.product],
            price: columns[header.price],
            date: columns[header.date],
        };

        if (!row.id || !row.product || !row.price || !row.date) {
            return undefined;
        }

        if (!Number.isFinite(Number(row.price))) {
            return undefined;
        }

        return row;
    }

    private splitLine(line: string) {
        if (line.includes('|')) {
            return line.split('|').map((column) => column.trim()).filter(Boolean);
        }

        if (line.includes(',')) {
            return line.split(',').map((column) => column.trim()).filter(Boolean);
        }

        if (line.includes('\t')) {
            return line.split('\t').map((column) => column.trim()).filter(Boolean);
        }

        return line.split(/\s{1,}/).map((column) => column.trim()).filter(Boolean);
    }

    private tryGetHeaderIndex(columns: string[]): HeaderIndex | undefined {
        const normalizedColumns = columns.map((column) => column.toLowerCase());
        const header = {
            id: normalizedColumns.indexOf('id'),
            product: normalizedColumns.indexOf('product'),
            price: normalizedColumns.indexOf('price'),
            date: normalizedColumns.indexOf('date'),
        };

        if (Object.values(header).some((index) => index < 0)) {
            return undefined;
        }

        return header;
    }
}
