"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const token = event.pathParameters?.token;
        if (!token)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing token'));
        // Resolve token → userPk + signalId
        const tokenItem = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: 'TOKEN', sk: token },
        }));
        if (!tokenItem.Item)
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Thread not found'));
        const { userPk, signalId, tokenExpiresAt } = tokenItem.Item;
        // Fetch signal + all its replies in one query
        const result = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': userPk,
                ':prefix': `SIGNAL#${signalId}`,
            },
        }));
        const items = result.Items ?? [];
        const signal = items.find(i => i.sk === `SIGNAL#${signalId}`);
        if (!signal)
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Signal not found'));
        const replies = items
            .filter(i => i.sk.includes('#REPLY#'))
            .map(r => ({
            id: r.sk.split('#REPLY#')[1],
            body: r.body,
            direction: r.direction,
            senderName: r.senderName ?? null,
            createdAt: r.createdAt,
        }))
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        // Fetch wayfarer profile for display name
        const profileResult = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: userPk, sk: 'PROFILE' },
        }));
        const profile = profileResult.Item;
        const wayfarer = {
            username: profile?.username ?? null,
            name: profile?.username ?? null,
            image: null,
        };
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({
            id: signalId,
            senderName: signal.senderName,
            body: signal.body,
            createdAt: signal.createdAt,
            tokenExpiresAt,
            wayfarer,
            replies,
        }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map