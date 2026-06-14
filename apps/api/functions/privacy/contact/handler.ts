import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { toApiGatewayResponse, created, badRequest, tooManyRequests, serverError } from '../../shared/response'

const ses = new SESv2Client({})
const RATE_LIMIT_TTL_SECONDS = 3600
const PRIVACY_INBOX = 'privacy@cairn.ing'

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    try {
        const parsed = JSON.parse(event.body ?? '{}')
        const { senderName, senderEmail, requestType, message } = parsed

        if (!senderName || !senderEmail || !requestType || !message) {
            return toApiGatewayResponse(badRequest('senderName, senderEmail, requestType, and message are required'))
        }

        const rateLimit = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `RATELIMIT#privacy#${senderEmail}`, sk: 'CHECK' },
        }))
        if (rateLimit.Item) return toApiGatewayResponse(tooManyRequests('Please wait before sending another request'))

        const ttl = Math.floor(Date.now() / 1000) + RATE_LIMIT_TTL_SECONDS
        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: { pk: `RATELIMIT#privacy#${senderEmail}`, sk: 'CHECK', ttl },
        }))

        await ses.send(new SendEmailCommand({
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
        }))

        return toApiGatewayResponse(created({ ok: true }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
