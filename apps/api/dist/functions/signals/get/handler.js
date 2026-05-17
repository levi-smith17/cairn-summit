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
        const result = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'SIGNAL#',
            },
        }));
        const items = result.Items ?? [];
        // Separate signals from replies — replies have #REPLY# in their sk
        const signalItems = [];
        const replyItems = [];
        for (const item of items) {
            if (item.sk.includes('#REPLY#')) {
                replyItems.push(item);
            }
            else {
                signalItems.push(item);
            }
        }
        // Build nested response, strip token from signal output
        const signals = signalItems
            .map(signal => {
            const signalId = signal.sk.split('#')[1];
            const replies = replyItems
                .filter(r => r.sk.startsWith(`SIGNAL#${signalId}#REPLY#`))
                .map(r => ({
                id: r.sk.split('#REPLY#')[1],
                body: r.body,
                direction: r.direction,
                senderName: r.senderName ?? null,
                senderEmail: r.senderEmail ?? null,
                createdAt: r.createdAt,
            }))
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return {
                id: signalId,
                senderName: signal.senderName,
                senderEmail: signal.senderEmail,
                body: signal.body,
                read: signal.read,
                createdAt: signal.createdAt,
                replies,
            };
        })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(signals));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map