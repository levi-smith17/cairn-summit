"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
const db_1 = require("../../shared/db");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const token = event.pathParameters?.token;
        if (!token)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing token'));
        const body = JSON.parse(event.body ?? '{}');
        if (!body.body)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('body is required'));
        // Resolve token
        const tokenItem = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: 'TOKEN', sk: token },
        }));
        if (!tokenItem.Item)
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Thread not found'));
        const { userPk, signalId, tokenExpiresAt } = tokenItem.Item;
        if (new Date(tokenExpiresAt) < new Date()) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Reply link has expired'));
        }
        const replyId = (0, crypto_1.randomUUID)();
        const sk = `SIGNAL#${signalId}#REPLY#${replyId}`;
        const reply = {
            pk: userPk,
            sk,
            body: body.body,
            direction: 'INBOUND',
            createdAt: new Date().toISOString(),
        };
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: db_1.TABLE_NAME,
            Item: reply,
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)({
            id: replyId,
            body: reply.body,
            direction: reply.direction,
            createdAt: reply.createdAt,
        }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map