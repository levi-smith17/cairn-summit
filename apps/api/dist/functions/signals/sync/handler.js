"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const body = JSON.parse(event.body ?? '{}');
        if (!body.since)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('since is required'));
        const sinceTime = new Date(body.since).getTime();
        if (isNaN(sinceTime))
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('since must be a valid ISO timestamp'));
        const pk = (0, auth_1.getPk)(event);
        // Query only main signals (exclude replies) using FilterExpression
        const result = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            FilterExpression: 'NOT contains(sk, :replyMarker)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'SIGNAL#',
                ':replyMarker': '#REPLY#',
            },
        }));
        const signals = result.Items ?? [];
        const unreadCount = signals.filter(s => !s.read).length;
        const newSignals = signals
            .filter(s => new Date(s.createdAt).getTime() > sinceTime)
            .map(s => ({
            id: s.sk.split('#')[1],
            senderName: s.senderName,
            body: s.body,
            read: s.read,
            createdAt: s.createdAt,
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ unreadCount, signals: newSignals }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map