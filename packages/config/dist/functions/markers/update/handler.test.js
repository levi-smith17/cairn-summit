"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('../../shared/db', () => ({
    dynamo: { send: vitest_1.vi.fn() },
    TABLE_NAME: 'cairn-test',
}));
const handler_1 = require("./handler");
const db_1 = require("../../shared/db");
const mockEvent = (sub, id, body) => ({
    requestContext: {
        authorizer: {
            jwt: {
                claims: { sub, email: 'test@cairn.local' },
                scopes: [],
            },
        },
        accountId: '',
        apiId: '',
        domainName: '',
        domainPrefix: '',
        http: {
            method: 'PUT',
            path: `/markers/${id}`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'PUT /markers/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PUT /markers/{id}',
    rawPath: `/markers/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
});
(0, vitest_1.describe)('markers/update handler', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('updates a marker and returns 200', async () => {
        const updated = {
            pk: 'USER#user-123',
            sk: 'MARKER#abc',
            name: 'Updated Summit',
            color: '#0000FF',
            icon: null,
            createdAt: '2026-01-01T00:00:00.000Z',
        };
        vitest_1.vi.mocked(db_1.dynamo.send).mockResolvedValueOnce({ Attributes: updated });
        const result = await (0, handler_1.handler)(mockEvent('user-123', 'abc', { name: 'Updated Summit', color: '#0000FF' }));
        (0, vitest_1.expect)(result.statusCode).toBe(200);
        (0, vitest_1.expect)(JSON.parse(result.body).data).toEqual(updated);
    });
    (0, vitest_1.it)('updates a marker with icon', async () => {
        const updated = {
            pk: 'USER#user-123',
            sk: 'MARKER#abc',
            name: 'Camp',
            color: '#00FF00',
            icon: 'tent',
            createdAt: '2026-01-01T00:00:00.000Z',
        };
        vitest_1.vi.mocked(db_1.dynamo.send).mockResolvedValueOnce({ Attributes: updated });
        const result = await (0, handler_1.handler)(mockEvent('user-123', 'abc', { name: 'Camp', color: '#00FF00', icon: 'tent' }));
        (0, vitest_1.expect)(result.statusCode).toBe(200);
        (0, vitest_1.expect)(JSON.parse(result.body).data.icon).toBe('tent');
    });
    (0, vitest_1.it)('returns 400 when id is missing', async () => {
        const result = await (0, handler_1.handler)(mockEvent('user-123', undefined, { name: 'Summit', color: '#FF0000' }));
        (0, vitest_1.expect)(result.statusCode).toBe(400);
        (0, vitest_1.expect)(JSON.parse(result.body).error).toBe('Missing marker id');
        (0, vitest_1.expect)(db_1.dynamo.send).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('returns 400 when name is missing', async () => {
        const result = await (0, handler_1.handler)(mockEvent('user-123', 'abc', { color: '#FF0000' }));
        (0, vitest_1.expect)(result.statusCode).toBe(400);
        (0, vitest_1.expect)(JSON.parse(result.body).error).toBe('name and color are required');
        (0, vitest_1.expect)(db_1.dynamo.send).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('returns 400 when color is missing', async () => {
        const result = await (0, handler_1.handler)(mockEvent('user-123', 'abc', { name: 'Summit' }));
        (0, vitest_1.expect)(result.statusCode).toBe(400);
        (0, vitest_1.expect)(JSON.parse(result.body).error).toBe('name and color are required');
        (0, vitest_1.expect)(db_1.dynamo.send).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('returns 500 when DynamoDB throws', async () => {
        vitest_1.vi.mocked(db_1.dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'));
        const result = await (0, handler_1.handler)(mockEvent('user-123', 'abc', { name: 'Summit', color: '#FF0000' }));
        (0, vitest_1.expect)(result.statusCode).toBe(500);
        (0, vitest_1.expect)(JSON.parse(result.body).error).toBe('Internal server error');
    });
});
//# sourceMappingURL=handler.test.js.map