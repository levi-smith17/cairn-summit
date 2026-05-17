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
        if (!id) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing guide id'));
        }
        const pk = (0, auth_1.getPk)(event);
        const stonesResult = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': `STONE#${id}#`,
            },
        }));
        const stones = stonesResult.Items ?? [];
        for (let i = 0; i < stones.length; i += 25) {
            const chunk = stones.slice(i, i + 25);
            await db_1.dynamo.send(new lib_dynamodb_1.BatchWriteCommand({
                RequestItems: {
                    [db_1.TABLE_NAME]: chunk.map(stone => ({
                        DeleteRequest: {
                            Key: { pk: stone.pk, sk: stone.sk },
                        },
                    })),
                },
            }));
        }
        await db_1.dynamo.send(new lib_dynamodb_1.DeleteCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `GUIDE#${id}` },
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.noContent)());
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map