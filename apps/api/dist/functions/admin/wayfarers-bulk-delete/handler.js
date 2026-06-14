"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
async function deleteAllUserItems(targetPk) {
    let lastKey;
    do {
        const res = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: { ':pk': targetPk },
            ExclusiveStartKey: lastKey,
        }));
        for (const item of (res.Items ?? [])) {
            await db_1.dynamo.send(new lib_dynamodb_1.DeleteCommand({
                TableName: db_1.TABLE_NAME,
                Key: { pk: item.pk, sk: item.sk },
            }));
        }
        lastKey = res.LastEvaluatedKey;
    } while (lastKey);
}
const handler = async (event) => {
    try {
        const pk = (0, auth_1.getPk)(event);
        const profileRes = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: 'PROFILE' },
        }));
        if (!profileRes.Item?.isAdmin)
            return (0, response_1.toApiGatewayResponse)((0, response_1.forbidden)('Admin access required'));
        const body = JSON.parse(event.body ?? '{}');
        if (!Array.isArray(body.ids))
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('ids is required'));
        for (const id of body.ids) {
            await deleteAllUserItems(`USER#${id}`);
        }
        return (0, response_1.toApiGatewayResponse)((0, response_1.noContent)());
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map