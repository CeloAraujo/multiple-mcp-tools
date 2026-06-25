import csvtojson from 'csvtojson';
import type { SalesRecord } from './types.ts';
import { SalesRecordMapper, type RawSalesRecord } from './salesRecordMapper.ts';

export class SalesCsvParser {
    private readonly mapper: SalesRecordMapper;

    constructor(mapper = new SalesRecordMapper()) {
        this.mapper = mapper;
    }

    async parse(csv: string): Promise<SalesRecord[]> {
        const rows = await csvtojson().fromString(csv.trim()) as RawSalesRecord[];

        return rows.map((row, index) => this.mapper.toSalesRecord(row, index));
    }
}
