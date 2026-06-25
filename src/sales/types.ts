export type SalesRecord = {
    id: string;
    product: string;
    price: number;
    date: string;
};

export type ProductSummary = {
    product: string;
    quantity: number;
    revenue: number;
};

export type DailyRevenue = {
    date: string;
    revenue: number;
};

export type SalesReportOptions = {
    alertRevenueBelow?: number;
    topProductsLimit?: number;
};

export type SalesReport = {
    generatedAt: string;
    totalSales: number;
    totalRevenue: number;
    averageTicket: number;
    uniqueProducts: number;
    topProducts: ProductSummary[];
    revenueByDate: DailyRevenue[];
    alerts: string[];
    reportPath?: string;
};
