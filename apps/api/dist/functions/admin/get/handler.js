"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
async function scanProfiles() {
    const items = [];
    let lastKey;
    do {
        const res = await db_1.dynamo.send(new lib_dynamodb_1.ScanCommand({
            TableName: db_1.TABLE_NAME,
            FilterExpression: 'sk = :sk',
            ExpressionAttributeValues: { ':sk': 'PROFILE' },
            ExclusiveStartKey: lastKey,
        }));
        items.push(...(res.Items ?? []));
        lastKey = res.LastEvaluatedKey;
    } while (lastKey);
    return items;
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
        const [profileItems, invRes, actRes] = await Promise.all([
            scanProfiles(),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': 'ADMIN', ':prefix': 'INVITATION#' },
            })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': 'ADMIN', ':prefix': 'ACTIVITY#' },
                ScanIndexForward: false,
                Limit: 50,
            })),
        ]);
        const wayfarers = profileItems.map((item) => ({
            id: item.pk.replace('USER#', ''),
            name: item.name ?? null,
            email: item.email ?? null,
            username: item.username ?? null,
            customDomain: item.customDomain ?? null,
            isAdmin: item.isAdmin ?? false,
            listed: item.listed ?? false,
            createdAt: item.createdAt,
        }));
        const invitations = (invRes.Items ?? []).map((item) => ({
            id: item.sk.replace('INVITATION#', ''),
            email: item.email,
            note: item.note ?? null,
            invitedBy: { name: item.invitedByName ?? null, email: item.invitedByEmail ?? null },
            expiresAt: item.expiresAt,
            usedAt: item.usedAt ?? null,
            createdAt: item.createdAt,
            token: item.token ?? null,
        }));
        const activities = (actRes.Items ?? []).map((item) => ({
            id: item.id,
            action: item.action,
            targetId: item.targetId ?? null,
            targetEmail: item.targetEmail ?? null,
            metadata: item.metadata ?? null,
            createdAt: item.createdAt,
            admin: { name: item.adminName ?? null, email: item.adminEmail ?? null },
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ wayfarers, invitations, activities }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map