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
        const profileRes = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: 'PROFILE' },
        }));
        if (!profileRes.Item?.isAdmin)
            return (0, response_1.toApiGatewayResponse)((0, response_1.forbidden)('Admin access required'));
        const body = JSON.parse(event.body ?? '{}');
        if (!body.email)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('email is required'));
        const id = (0, crypto_1.randomUUID)();
        const now = new Date().toISOString();
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: db_1.TABLE_NAME,
            Item: {
                pk: `USER#${id}`,
                sk: 'PROFILE',
                name: body.name ?? null,
                email: body.email,
                username: body.username ?? null,
                customDomain: body.customDomain ?? null,
                isAdmin: body.isAdmin ?? false,
                listed: body.listed ?? false,
                defaultTerminology: 'CAIRN',
                defaultTheme: 'SYSTEM',
                timeFormat: 'TWELVE',
                createdAt: now,
            },
        }));
        try {
            await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
                TableName: db_1.TABLE_NAME,
                Item: {
                    pk: 'ADMIN',
                    sk: `ACTIVITY#${now}#${(0, crypto_1.randomUUID)()}`,
                    id: (0, crypto_1.randomUUID)(),
                    action: 'WAYFARER_CREATED',
                    targetId: id,
                    targetEmail: body.email,
                    adminName: profileRes.Item.name ?? null,
                    adminEmail: profileRes.Item.email ?? null,
                    createdAt: now,
                },
            }));
        }
        catch { }
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)({ id }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map