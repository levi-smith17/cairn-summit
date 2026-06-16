"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const cache_1 = require("../../shared/cache");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const id = (0, auth_1.getPathId)(event);
        if (!id) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing cache id'));
        }
        const body = JSON.parse(event.body ?? '{}');
        if (body.limit === undefined) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('limit is required'));
        }
        const pk = (0, auth_1.getPk)(event);
        const result = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'CACHE#',
            },
        }));
        const cache = (0, cache_1.findCacheById)((result.Items ?? []), id);
        if (!cache) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Cache not found'));
        }
        const updateResult = await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: cache.sk },
            UpdateExpression: 'SET #limit = :limit',
            ExpressionAttributeNames: { '#limit': 'limit' },
            ExpressionAttributeValues: { ':limit': body.limit },
            ReturnValues: 'ALL_NEW',
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(updateResult.Attributes));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map