"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const id = (0, auth_1.getPathId)(event);
        if (!id)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing signal id'));
        const pk = (0, auth_1.getPk)(event);
        // Query the signal + all its replies (all share the SIGNAL#<id> prefix)
        const result = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': `SIGNAL#${id}`,
            },
        }));
        const items = result.Items ?? [];
        if (items.length === 0)
            return (0, response_1.toApiGatewayResponse)((0, response_1.noContent)());
        // BatchWrite supports 25 items per call
        const chunks = [];
        for (let i = 0; i < items.length; i += 25) {
            chunks.push(items.slice(i, i + 25));
        }
        await Promise.all(chunks.map(chunk => db_1.dynamo.send(new lib_dynamodb_1.BatchWriteCommand({
            RequestItems: {
                [db_1.TABLE_NAME]: chunk.map(item => ({
                    DeleteRequest: { Key: { pk, sk: item.sk } },
                })),
            },
        }))));
        return (0, response_1.toApiGatewayResponse)((0, response_1.noContent)());
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map