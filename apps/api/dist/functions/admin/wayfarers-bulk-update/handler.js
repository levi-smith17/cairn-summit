"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
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
        await Promise.all(body.ids.map((id) => db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: `USER#${id}`, sk: 'PROFILE' },
            UpdateExpression: 'SET listed = :listed',
            ExpressionAttributeValues: { ':listed': body.listed ?? false },
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