import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

export class SalesReportWriter {
    private readonly reportsDir: string;

    constructor(reportsDir = 'reports') {
        this.reportsDir = reportsDir;
    }

    async save(content: string, generatedAt: string) {
        await mkdir(this.reportsDir, { recursive: true });

        const fileName = `sales-report-${this.toFileTimestamp(generatedAt)}.txt`;
        const reportPath = join(this.reportsDir, fileName);

        await writeFile(reportPath, content, 'utf-8');

        return reportPath;
    }

    private toFileTimestamp(value: string) {
        return value.replace(/[:.]/g, '-');
    }
}
