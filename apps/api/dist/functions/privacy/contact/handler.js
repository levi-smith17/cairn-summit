"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_sesv2_1 = require("@aws-sdk/client-sesv2");
const db_1 = require("../../shared/db");
const response_1 = require("../../shared/response");
const ses = new client_sesv2_1.SESv2Client({});
const RATE_LIMIT_TTL_SECONDS = 3600;
const PRIVACY_INBOX = 'privacy@cairn.ing';
const handler = async (event) => {
    try {
        const parsed = JSON.parse(event.body ?? '{}');
        const { senderName, senderEmail, requestType, message } = parsed;
        if (!senderName || !senderEmail || !requestType || !message) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('senderName, senderEmail, requestType, and message are required'));
        }
        const rateLimit = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: `RATELIMIT#privacy#${senderEmail}`, sk: 'CHECK' },
        }));
        if (rateLimit.Item)
            return (0, response_1.toApiGatewayResponse)((0, response_1.tooManyRequests)('Please wait before sending another request'));
        const ttl = Math.floor(Date.now() / 1000) + RATE_LIMIT_TTL_SECONDS;
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: db_1.TABLE_NAME,
            Item: { pk: `RATELIMIT#privacy#${senderEmail}`, sk: 'CHECK', ttl },
        }));
        await ses.send(new client_sesv2_1.SendEmailCommand({
            FromEmailAddress: process.env.SES_FROM_EMAIL,
            Destination: { ToAddresses: [PRIVACY_INBOX] },
            ReplyToAddresses: [senderEmail],
            ConfigurationSetName: process.env.SES_CONFIGURATION_SET,
            Content: {
                Simple: {
                    Subject: { Data: `Privacy request: ${requestType}`, Charset: 'UTF-8' },
                    Body: {
                        Text: {
                            Data: [
                                `Request type: ${requestType}`,
                                `From: ${senderName} <${senderEmail}>`,
                                '',
                                message,
                            ].join('\n'),
                            Charset: 'UTF-8',
                        },
                    },
                },
            },
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)({ ok: true }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map