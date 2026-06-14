"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const signals_1 = require("../../shared/signals");
const response_1 = require("../../shared/response");
const RATE_LIMIT_TTL_SECONDS = 3600;
const handler = async (event) => {
    try {
        const username = event.pathParameters?.username;
        if (!username)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing username'));
        const parsed = JSON.parse(event.body ?? '{}');
        const { senderName, senderEmail, body: message } = parsed;
        if (!senderName || !senderEmail || !message) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('senderName, senderEmail, and body are required'));
        }
        const rateLimit = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: `RATELIMIT#${senderEmail}`, sk: 'CHECK' },
        }));
        if (rateLimit.Item)
            return (0, response_1.toApiGatewayResponse)((0, response_1.tooManyRequests)('Please wait before sending another message'));
        const ttl = Math.floor(Date.now() / 1000) + RATE_LIMIT_TTL_SECONDS;
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: db_1.TABLE_NAME,
            Item: { pk: `RATELIMIT#${senderEmail}`, sk: 'CHECK', ttl },
        }));
        const result = await (0, signals_1.createContactSignal)({
            username,
            senderName,
            senderEmail,
            body: message,
        });
        if (!result)
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('User not found'));
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)({
            id: result.id,
            threadUrl: result.threadUrl,
        }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map