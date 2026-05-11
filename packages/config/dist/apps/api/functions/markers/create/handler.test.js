"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('../../shared/db', () => ({
    dynamo: { send: vitest_1.vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}));
const handler_1 = require("./handler");
const db_1 = require("../../shared/db");
const mockEvent = (sub, body) => ({
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
            method: 'POST',
            path: '/markers',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /markers',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /markers',
    rawPath: '/markers',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
});
(0, vitest_1.describe)('markers/create handler', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('creates a marker and returns 201', async () => {
        vitest_1.vi.mocked(db_1.dynamo.send).mockImplementationOnce(() => Promise.resolve({ Items: [] }));
        const result = await (0, handler_1.handler)(mockEvent('user-123', { name: 'Summit', color: '#FF0000' }));
        (0, vitest_1.expect)(result.statusCode).toBe(201);
        const data = JSON.parse(result.body).data;
        (0, vitest_1.expect)(data.name).toBe('Summit');
        (0, vitest_1.expect)(data.color).toBe('#FF0000');
        (0, vitest_1.expect)(data.pk).toBe('USER#user-123');
        (0, vitest_1.expect)(data.sk).toMatch(/^MARKER#/);
        (0, vitest_1.expect)(data.createdAt).toBeDefined();
    });
    (0, vitest_1.it)('creates a marker with optional icon', async () => {
        vitest_1.vi.mocked(db_1.dynamo.send).mockImplementationOnce(() => Promise.resolve({ Items: [] }));
        const result = await (0, handler_1.handler)(mockEvent('user-123', { name: 'Camp', color: '#00FF00', icon: 'tent' }));
        (0, vitest_1.expect)(result.statusCode).toBe(201);
        (0, vitest_1.expect)(JSON.parse(result.body).data.icon).toBe('tent');
    });
    (0, vitest_1.it)('returns 400 when name is missing', async () => {
        const result = await (0, handler_1.handler)(mockEvent('user-123', { color: '#FF0000' }));
        (0, vitest_1.expect)(result.statusCode).toBe(400);
        (0, vitest_1.expect)(JSON.parse(result.body).error).toBe('name and color are required');
        (0, vitest_1.expect)(db_1.dynamo.send).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('returns 400 when color is missing', async () => {
        const result = await (0, handler_1.handler)(mockEvent('user-123', { name: 'Summit' }));
        (0, vitest_1.expect)(result.statusCode).toBe(400);
        (0, vitest_1.expect)(JSON.parse(result.body).error).toBe('name and color are required');
        (0, vitest_1.expect)(db_1.dynamo.send).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('returns 500 when DynamoDB throws', async () => {
        vitest_1.vi.mocked(db_1.dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')));
        const result = await (0, handler_1.handler)(mockEvent('user-123', { name: 'Summit', color: '#FF0000' }));
        (0, vitest_1.expect)(result.statusCode).toBe(500);
        (0, vitest_1.expect)(JSON.parse(result.body).error).toBe('Internal server error');
    });
});
//# sourceMappingURL=handler.test.js.map