import type { DailyRevenue, ProductSummary, SalesRecord, SalesReport, SalesReportOptions } from './types.ts';
import { formatMoney, roundMoney } from './money.ts';

export class SalesReportService {
    generate(records: SalesRecord[], options: SalesReportOptions = {}): SalesReport {
        const topProductsLimit = options.topProductsLimit ?? 5;
        const totalRevenue = roundMoney(records.reduce((sum, record) => sum + record.price, 0));
        const totalSales = records.length;
        const averageTicket = totalSales ? roundMoney(totalRevenue / totalSales) : 0;
        const productSummaries = this.getProductSummaries(records);

        return {
            generatedAt: new Date().toISOString(),
            totalSales,
            totalRevenue,
            averageTicket,
            uniqueProducts: productSummaries.length,
            topProducts: productSummaries.slice(0, topProductsLimit),
            revenueByDate: this.getRevenueByDate(records),
            alerts: this.getAlerts({
                totalSales,
                totalRevenue,
                topProduct: productSummaries.at(0),
                alertRevenueBelow: options.alertRevenueBelow,
            }),
        };
    }

    toText(report: SalesReport): string {
        const topProducts = report.topProducts
            .map((item, index) => `${index + 1}. ${item.product}: ${item.quantity} vendas, ${formatMoney(item.revenue)}`)
            .join('\n');

        const revenueByDate = report.revenueByDate
            .map((item) => `- ${item.date}: ${formatMoney(item.revenue)}`)
            .join('\n');

        const alerts = report.alerts.length
            ? report.alerts.map((alert) => `- ${alert}`).join('\n')
            : '- Nenhum alerta gerado.';

        return [
            'Relatorio automatico de vendas',
            `Gerado em: ${report.generatedAt}`,
            '',
            `Total de vendas: ${report.totalSales}`,
            `Receita total: ${formatMoney(report.totalRevenue)}`,
            `Ticket medio: ${formatMoney(report.averageTicket)}`,
            `Produtos unicos: ${report.uniqueProducts}`,
            '',
            'Top produtos',
            topProducts || '- Sem produtos.',
            '',
            'Receita por data',
            revenueByDate || '- Sem vendas por data.',
            '',
            'Alertas',
            alerts,
            '',
        ].join('\n');
    }

    private getProductSummaries(records: SalesRecord[]): ProductSummary[] {
        const products = new Map<string, ProductSummary>();

        for (const record of records) {
            const current = products.get(record.product) ?? {
                product: record.product,
                quantity: 0,
                revenue: 0,
            };

            current.quantity += 1;
            current.revenue = roundMoney(current.revenue + record.price);
            products.set(record.product, current);
        }

        return [...products.values()].sort((a, b) => b.revenue - a.revenue);
    }

    private getRevenueByDate(records: SalesRecord[]): DailyRevenue[] {
        const dates = new Map<string, number>();

        for (const record of records) {
            dates.set(record.date, roundMoney((dates.get(record.date) ?? 0) + record.price));
        }

        return [...dates.entries()]
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    private getAlerts(input: {
        totalSales: number;
        totalRevenue: number;
        topProduct?: ProductSummary;
        alertRevenueBelow?: number;
    }) {
        const alerts: string[] = [];

        if (input.totalSales === 0) {
            alerts.push('Nenhuma venda encontrada no CSV.');
        }

        if (input.alertRevenueBelow !== undefined && input.totalRevenue < input.alertRevenueBelow) {
            alerts.push(`Receita total abaixo do limite configurado: ${formatMoney(input.alertRevenueBelow)}.`);
        }

        if (input.topProduct && input.totalRevenue > 0) {
            const concentration = input.topProduct.revenue / input.totalRevenue;

            if (concentration >= 0.3) {
                alerts.push(`Produto "${input.topProduct.product}" concentra ${(concentration * 100).toFixed(1)}% da receita.`);
            }
        }

        return alerts;
    }
}
