"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('../../shared/db', () => ({
    dynamo: { send: vitest_1.vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}));
const handler_1 = require("./handler");
const db_1 = require("../../shared/db");
const mockEvent = (sub, id) => ({
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
            method: 'DELETE',
            path: `/markers/${id}`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'DELETE /markers/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'DELETE /markers/{id}',
    rawPath: `/markers/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    isBase64Encoded: false,
});
(0, vitest_1.describe)('markers/delete handler', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('deletes a marker and returns 204', async () => {
        vitest_1.vi.mocked(db_1.dynamo.send).mockImplementationOnce(() => Promise.resolve({}));
        const result = await (0, handler_1.handler)(mockEvent('user-123', 'abc'));
        (0, vitest_1.expect)(result.statusCode).toBe(204);
    });
    (0, vitest_1.it)('calls DynamoDB with correct key', async () => {
        vitest_1.vi.mocked(db_1.dynamo.send).mockImplementationOnce(() => Promise.resolve({}));
        await (0, handler_1.handler)(mockEvent('user-456', 'xyz'));
        (0, vitest_1.expect)(db_1.dynamo.send).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            input: vitest_1.expect.objectContaining({
                Key: {
                    pk: 'USER#user-456',
                    sk: 'MARKER#xyz',
                },
            }),
        }));
    });
    (0, vitest_1.it)('returns 400 when id is missing', async () => {
        const result = await (0, handler_1.handler)(mockEvent('user-123', undefined));
        (0, vitest_1.expect)(result.statusCode).toBe(400);
        (0, vitest_1.expect)(JSON.parse(result.body).error).toBe('Missing marker id');
        (0, vitest_1.expect)(db_1.dynamo.send).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('returns 500 when DynamoDB throws', async () => {
        vitest_1.vi.mocked(db_1.dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')));
        const result = await (0, handler_1.handler)(mockEvent('user-123', 'abc'));
        (0, vitest_1.expect)(result.statusCode).toBe(500);
        (0, vitest_1.expect)(JSON.parse(result.body).error).toBe('Internal server error');
    });
});
//# sourceMappingURL=handler.test.js.map