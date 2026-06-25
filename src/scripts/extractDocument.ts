import { createDocumentExtractionService } from '../documents/documentContainer.ts';

const service = createDocumentExtractionService();
const csv = [
    'id,product,price',
    '1,soap,5.49',
    '2,rice,22.90',
].join('\n');

const result = await service.extract({
    fileName: 'sample.csv',
    mimeType: 'text/csv',
    contentBase64: Buffer.from(csv, 'utf-8').toString('base64'),
});

console.log(JSON.stringify(result, null, 2));
