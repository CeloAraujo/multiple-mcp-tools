import { createServer } from './server.ts';

const app = await createServer();

await app.listen({ port: 3000, host: '0.0.0.0' });

console.log('API is running on http://0.0.0.0:3000');
