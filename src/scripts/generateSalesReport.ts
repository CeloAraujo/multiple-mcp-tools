import { SalesAutomationService } from '../sales/salesAutomationService.ts';

const service = new SalesAutomationService();
const result = await service.run({
    alertRevenueBelow: 1000,
    topProductsLimit: 5,
});

console.log(JSON.stringify(result.report, null, 2));
