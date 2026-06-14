"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContactSignal = createContactSignal;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_sesv2_1 = require("@aws-sdk/client-sesv2");
const crypto_1 = require("crypto");
const db_1 = require("./db");
const ses = new client_sesv2_1.SESv2Client({});
const TOKEN_TTL_DAYS = 7;
async function createContactSignal(input) {
    const scan = await db_1.dynamo.send(new lib_dynamodb_1.ScanCommand({
        TableName: db_1.TABLE_NAME,
        FilterExpression: 'sk = :sk AND username = :username',
        ExpressionAttributeValues: {
            ':sk': 'PROFILE',
            ':username': input.username,
        },
    }));
    const profile = scan.Items?.[0];
    if (!profile)
        return null;
    const userPk = profile.pk;
    const wayfarerEmail = profile.email;
    const id = (0, crypto_1.randomUUID)();
    const sk = `SIGNAL#${id}`;
    const token = (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const webUrl = (process.env.WEB_URL ?? '').replace(/\/$/, '');
    const threadUrl = `${webUrl}/thread/${token}`;
    const signal = {
        pk: userPk,
        sk,
        senderName: input.senderName,
        senderEmail: input.senderEmail,
        body: input.body,
        read: false,
        token,
        tokenExpiresAt,
        createdAt: now,
    };
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
    if (wayfarerEmail && process.env.SES_FROM_EMAIL) {
        await ses.send(new client_sesv2_1.SendEmailCommand({
            FromEmailAddress: process.env.SES_FROM_EMAIL,
            Destination: { ToAddresses: [wayfarerEmail] },
            ConfigurationSetName: process.env.SES_CONFIGURATION_SET,
            Content: {
                Simple: {
                    Subject: { Data: 'New message on Cairn', Charset: 'UTF-8' },
                    Body: {
                        Text: {
                            Data: [
                                `You have a new message from ${input.senderName} (${input.senderEmail}):`,
                                '',
                                input.body,
                                '',
                                `View and reply in Cairn: ${webUrl}/signals`,
                                `Visitor thread link: ${threadUrl}`,
                            ].join('\n'),
                            Charset: 'UTF-8',
                        },
                    },
                },
            },
        }));
    }
    return { id, token, threadUrl };
}
//# sourceMappingURL=signals.js.map