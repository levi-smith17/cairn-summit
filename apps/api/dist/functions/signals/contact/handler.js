"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
const db_1 = require("../../shared/db");
const response_1 = require("../../shared/response");
const TOKEN_TTL_DAYS = 7;
const handler = async (event) => {
    try {
        const username = event.pathParameters?.username;
        if (!username)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing username'));
        const body = JSON.parse(event.body ?? '{}');
        if (!body.senderName || !body.senderEmail || !body.body) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('senderName, senderEmail, and body are required'));
        }
        // Find user by username — scan is acceptable for this low-frequency public endpoint
        const scan = await db_1.dynamo.send(new lib_dynamodb_1.ScanCommand({
            TableName: db_1.TABLE_NAME,
            FilterExpression: 'sk = :sk AND username = :username',
            ExpressionAttributeValues: {
                ':sk': 'PROFILE',
                ':username': username,
            },
        }));
        const profile = scan.Items?.[0];
        if (!profile)
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('User not found'));
        const userPk = profile.pk;
        const id = (0, crypto_1.randomUUID)();
        const sk = `SIGNAL#${id}`;
        const token = (0, crypto_1.randomUUID)();
        const now = new Date().toISOString();
        const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
        const signal = {
            pk: userPk,
            sk,
            senderName: body.senderName,
            senderEmail: body.senderEmail,
            body: body.body,
            read: false,
            token,
            tokenExpiresAt,
            createdAt: now,
        };
        // Store signal + a token lookup item in parallel
        await Promise.all([
            db_1.dynamo.send(new lib_dynamodb_1.PutCommand({ TableName: db_1.TABLE_NAME, Item: signal })),
            db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
                TableName: db_1.TABLE_NAME,
                Item: {
                    pk: 'TOKEN',
                    sk: token,
                    userPk,
                    signalId: id,
                    tokenExpiresAt,
                },
            })),
        ]);
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)({ id }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map