"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const invites_1 = require("../../shared/invites");
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
        const token = (0, crypto_1.randomUUID)();
        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: db_1.TABLE_NAME,
            Item: {
                pk: 'ADMIN',
                sk: `INVITATION#${id}`,
                id,
                token,
                email: body.email,
                note: body.note ?? null,
                invitedByName: profileRes.Item.name ?? null,
                invitedByEmail: profileRes.Item.email ?? null,
                expiresAt,
                usedAt: null,
                createdAt: now,
            },
        }));
        await (0, invites_1.writeInviteLookup)(token, id);
        try {
            await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
                TableName: db_1.TABLE_NAME,
                Item: {
                    pk: 'ADMIN',
                    sk: `ACTIVITY#${now}#${(0, crypto_1.randomUUID)()}`,
                    id: (0, crypto_1.randomUUID)(),
                    action: 'INVITATION_SENT',
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