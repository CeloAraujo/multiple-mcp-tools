import { readFile } from 'fs/promises';
import { SalesCsvParser } from './salesCsvParser.ts';
import { CsvSalesFileParser, SalesFileParserRegistry, SpreadsheetSalesFileParser, type SalesFileInput } from './salesFileParsers.ts';
import { SalesReportService } from './salesReportService.ts';
import { SalesReportWriter } from './salesReportWriter.ts';
import type { SalesReportOptions } from './types.ts';

export type SalesAutomationInput = SalesReportOptions & {
    csv?: string;
    saveReport?: boolean;
};

export class SalesAutomationService {
    private readonly parser: SalesCsvParser;
    private readonly fileParserRegistry: SalesFileParserRegistry;
    private readonly reportService: SalesReportService;
    private readonly writer: SalesReportWriter;

    constructor(
        parser = new SalesCsvParser(),
        fileParserRegistry = new SalesFileParserRegistry([
            new CsvSalesFileParser(),
            new SpreadsheetSalesFileParser(),
        ]),
        reportService = new SalesReportService(),
        writer = new SalesReportWriter(),
    ) {
        this.parser = parser;
        this.fileParserRegistry = fileParserRegistry;
        this.reportService = reportService;
        this.writer = writer;
    }

    async run(input: SalesAutomationInput = {}) {
        const csv = input.csv?.trim() || await readFile('data/sales-complete.csv', 'utf-8');
        const records = await this.parser.parse(csv);
        return this.buildReport(records, input);
    }

    async runFromFile(file: SalesFileInput, options: SalesAutomationInput = {}) {
        const parser = this.fileParserRegistry.getParser(file);
        const records = await parser.parse(file);

        return this.buildReport(records, options);
    }

    private async buildReport(records: Awaited<ReturnType<SalesCsvParser['parse']>>, options: SalesAutomationInput) {
        const report = this.reportService.generate(records, {
            alertRevenueBelow: options.alertRevenueBelow,
            topProductsLimit: options.topProductsLimit,
        });
        const textReport = this.reportService.toText(report);

        if (options.saveReport ?? true) {
            report.reportPath = await this.writer.save(textReport, report.generatedAt);
        }

        return {
            report,
            textReport,
        };
    }
}
