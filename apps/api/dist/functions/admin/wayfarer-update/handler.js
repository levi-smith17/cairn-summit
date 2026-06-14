"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const pk = (0, auth_1.getPk)(event);
        const targetId = (0, auth_1.getPathId)(event);
        if (!targetId)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('id is required'));
        const profileRes = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: 'PROFILE' },
        }));
        if (!profileRes.Item?.isAdmin)
            return (0, response_1.toApiGatewayResponse)((0, response_1.forbidden)('Admin access required'));
        const body = JSON.parse(event.body ?? '{}');
        if (!body.email)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('email is required'));
        const now = new Date().toISOString();
        await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: `USER#${targetId}`, sk: 'PROFILE' },
            UpdateExpression: 'SET #name = :name, email = :email, username = :username, customDomain = :customDomain, isAdmin = :isAdmin, listed = :listed',
            ExpressionAttributeNames: { '#name': 'name' },
            ExpressionAttributeValues: {
                ':name': body.name ?? null,
                ':email': body.email,
                ':username': body.username ?? null,
                ':customDomain': body.customDomain ?? null,
                ':isAdmin': body.isAdmin ?? false,
                ':listed': body.listed ?? false,
            },
        }));
        try {
            await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
                TableName: db_1.TABLE_NAME,
                Item: {
                    pk: 'ADMIN',
                    sk: `ACTIVITY#${now}#${(0, crypto_1.randomUUID)()}`,
                    id: (0, crypto_1.randomUUID)(),
                    action: 'WAYFARER_UPDATED',
                    targetId,
                    targetEmail: body.email,
                    adminName: profileRes.Item.name ?? null,
                    adminEmail: profileRes.Item.email ?? null,
                    createdAt: now,
                },
            }));
        }
        catch { }
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ id: targetId }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map