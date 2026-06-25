import type { SalesRecord } from './types.ts';

export type RawSalesRecord = {
    id?: unknown;
    product?: unknown;
    price?: unknown;
    date?: unknown;
};

export class SalesRecordMapper {
    toSalesRecord(row: RawSalesRecord, index: number): SalesRecord {
        const id = this.toRequiredString(row.id, 'id', index);
        const product = this.toRequiredString(row.product, 'product', index);
        const date = this.toRequiredString(row.date, 'date', index);
        const price = Number(row.price);

        if (!Number.isFinite(price)) {
            throw new Error(`Invalid price at row ${index + 1}`);
        }

        return {
            id,
            product,
            price,
            date,
        };
    }

    private toRequiredString(value: unknown, field: string, index: number) {
        const normalized = String(value ?? '').trim();

        if (!normalized) {
            throw new Error(`Missing ${field} at row ${index + 1}`);
        }

        return normalized;
    }
}
