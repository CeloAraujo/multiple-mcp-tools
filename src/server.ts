import { HumanMessage } from '@langchain/core/messages';
import multipart from '@fastify/multipart';
import type { SalesAutomationInput } from './sales/salesAutomationService.ts';
import { createApplicationContainer, type ApplicationContainer } from './container/applicationContainer.ts';
import type { DocumentExtractionRequest } from './documents/types.ts';

import Fastify from 'fastify';

export const createServer = async (container?: ApplicationContainer) => {
    const application = container ?? await createApplicationContainer();
    const graph = application.graph;
    const app = Fastify();
    await app.register(multipart);
    const salesAutomationService = application.salesAutomationService;
    const documentExtractionService = application.documentExtractionService;

    const askAgent = async (question: string) => {
        const response = await graph.invoke({
            messages: [new HumanMessage(question)],
        });

        return response.answer ?? response.messages.at(-1)?.text ?? 'No response generated.';
    };

    const normalizeSalesAutomationInput = (input: SalesAutomationInput = {}) => ({
        csv: input.csv,
        saveReport: toOptionalBoolean(input.saveReport),
        alertRevenueBelow: toOptionalNumber(input.alertRevenueBelow),
        topProductsLimit: toBoundedOptionalNumber(input.topProductsLimit, 1, 20),
    });

    app.post('/chat', {
        schema: {
            body: {
                type: 'object',
                required: ['question'],
                properties: {
                    question: { type: 'string', minLength: 10 },
                },
            }
        }
    }, async function (request, reply) {
        try {
            const { question } = request.body as {
                question: string;
            };

            const answer = await askAgent(question);

            return reply.send(answer);

        } catch (error) {
            console.error('❌ Error processing request:', error);
            return reply.status(500).send({
                error: 'An error occurred while processing your request.',
            });
        }
    });

    app.post('/automation/chat', {
        schema: {
            body: {
                type: 'object',
                required: ['question'],
                properties: {
                    question: { type: 'string', minLength: 10 },
                },
            }
        }
    }, async function (request, reply) {
        try {
            const { question } = request.body as {
                question: string;
            };

            const answer = await askAgent(question);

            return reply.send({
                answer,
            });

        } catch (error) {
            console.error('Error processing automation request:', error);
            return reply.status(500).send({
                error: 'An error occurred while processing your request.',
            });
        }
    });

    app.post('/automation/sales-report', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    csv: { type: 'string' },
                    saveReport: { anyOf: [{ type: 'boolean' }, { type: 'string' }] },
                    alertRevenueBelow: { anyOf: [{ type: 'number' }, { type: 'string' }] },
                    topProductsLimit: { anyOf: [{ type: 'number' }, { type: 'string' }] },
                },
            }
        }
    }, async function (request, reply) {
        try {
            const payload = request.body as SalesAutomationInput | undefined;
            const result = await salesAutomationService.run(normalizeSalesAutomationInput(payload));

            return reply.send(result);

        } catch (error) {
            console.error('Error processing sales report automation:', error);
            return reply.status(500).send({
                error: error instanceof Error ? error.message : 'An error occurred while processing your request.',
            });
        }
    });

    app.post('/automation/sales-report/upload', async function (request, reply) {
        try {
            const upload = await readMultipartUpload(request);

            if (!upload.file) {
                return reply.status(400).send({
                    error: 'A file field is required.',
                });
            }

            const result = await salesAutomationService.runFromFile(upload.file, normalizeSalesAutomationInput(upload.fields));

            return reply.send(result);

        } catch (error) {
            console.error('Error processing uploaded sales report:', error);
            return reply.status(500).send({
                error: error instanceof Error ? error.message : 'An error occurred while processing the uploaded sales report.',
            });
        }
    });

    app.post('/automation/document/extract', {
        schema: {
            body: {
                type: 'object',
                required: ['fileName', 'contentBase64'],
                properties: {
                    fileName: { type: 'string', minLength: 1 },
                    contentBase64: { type: 'string', minLength: 1 },
                    mimeType: { type: 'string' },
                },
            }
        }
    }, async function (request, reply) {
        try {
            const payload = request.body as DocumentExtractionRequest;
            const document = await documentExtractionService.extract(payload);

            return reply.send({
                document,
            });

        } catch (error) {
            console.error('Error extracting document:', error);
            return reply.status(500).send({
                error: error instanceof Error ? error.message : 'An error occurred while extracting the document.',
            });
        }
    });

    app.post('/automation/document/upload', async function (request, reply) {
        try {
            const uploadedFile = await request.file();

            if (!uploadedFile) {
                return reply.status(400).send({
                    error: 'A file field is required.',
                });
            }

            const buffer = await uploadedFile.toBuffer();
            const document = await documentExtractionService.extract({
                fileName: uploadedFile.filename,
                mimeType: uploadedFile.mimetype,
                contentBase64: buffer.toString('base64'),
            });

            return reply.send({
                document,
            });

        } catch (error) {
            console.error('Error extracting uploaded document:', error);
            return reply.status(500).send({
                error: error instanceof Error ? error.message : 'An error occurred while extracting the uploaded document.',
            });
        }
    });

    return app;
};

const toOptionalNumber = (value: unknown) => {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
        return undefined;
    }

    return numberValue;
};

const toBoundedOptionalNumber = (value: unknown, min: number, max: number) => {
    const numberValue = toOptionalNumber(value);

    if (numberValue === undefined) {
        return undefined;
    }

    return Math.min(Math.max(Math.trunc(numberValue), min), max);
};

const toOptionalBoolean = (value: unknown) => {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }

    return undefined;
};

const readMultipartUpload = async (request: any) => {
    const fields: Record<string, unknown> = {};
    let file: { fileName: string; mimeType?: string; content: Buffer } | undefined;

    for await (const part of request.parts()) {
        if (part.type === 'file') {
            file = {
                fileName: part.filename,
                mimeType: part.mimetype,
                content: await part.toBuffer(),
            };
            continue;
        }

        fields[part.fieldname] = part.value;
    }

    return {
        fields,
        file,
    };
};
