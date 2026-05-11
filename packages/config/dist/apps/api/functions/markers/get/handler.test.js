"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock the shared db module before importing handler
vitest_1.vi.mock('../../shared/db', () => ({
    dynamo: { send: vitest_1.vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}));
const handler_1 = require("./handler");
const db_1 = require("../../shared/db");
const mockEvent = (sub) => ({
    requestContext: {
        authorizer: {
            jwt: {
                claims: { sub, email: 'test@cairn.local' },
                scopes: [],
            },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '',
        apiId: '',
        domainName: '',
        domainPrefix: '',
        http: {
            method: 'GET',
            path: '/markers',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /markers',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /markers',
    rawPath: '/markers',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
});
(0, vitest_1.describe)('markers/get handler', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('returns empty array when user has no markers', async () => {
        vitest_1.vi.mocked(db_1.dynamo.send).mockImplementationOnce(() => Promise.resolve({ Items: [] }));
        const result = await (0, handler_1.handler)(mockEvent('user-123'));
        (0, vitest_1.expect)(result.statusCode).toBe(200);
        (0, vitest_1.expect)(JSON.parse(result.body).data).toEqual([]);
    });
    (0, vitest_1.it)('returns markers for the user', async () => {
        const markers = [
            {
                pk: 'USER#user-123',
                sk: 'MARKER#abc',
                name: 'Summit',
                color: '#FF0000',
                createdAt: '2026-01-01T00:00:00.000Z',
            },
        ];
        vitest_1.vi.mocked(db_1.dynamo.send).mockImplementationOnce(() => Promise.resolve({ Items: markers }));
        const result = await (0, handler_1.handler)(mockEvent('user-123'));
        (0, vitest_1.expect)(result.statusCode).toBe(200);
        (0, vitest_1.expect)(JSON.parse(result.body).data).toEqual(markers);
    });
    (0, vitest_1.it)('queries with correct pk and sk prefix', async () => {
        vitest_1.vi.mocked(db_1.dynamo.send).mockImplementationOnce(() => Promise.resolve({ Items: [] }));
        await (0, handler_1.handler)(mockEvent('user-456'));
        (0, vitest_1.expect)(db_1.dynamo.send).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            input: vitest_1.expect.objectContaining({
                ExpressionAttributeValues: {
                    ':pk': 'USER#user-456',
                    ':prefix': 'MARKER#',
                },
            }),
        }));
    });
    (0, vitest_1.it)('returns 500 when DynamoDB throws', async () => {
        vitest_1.vi.mocked(db_1.dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')));
        const result = await (0, handler_1.handler)(mockEvent('user-123'));
        (0, vitest_1.expect)(result.statusCode).toBe(500);
        (0, vitest_1.expect)(JSON.parse(result.body).error).toBe('Internal server error');
    });
});
//# sourceMappingURL=handler.test.js.map