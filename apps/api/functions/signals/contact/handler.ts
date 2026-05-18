import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { toApiGatewayResponse, created, badRequest, notFound, tooManyRequests, serverError } from '../../shared/response'

const ses = new SESv2Client({})
const RATE_LIMIT_TTL_SECONDS = 3600

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    try {
        const username = event.pathParameters?.username
        if (!username) return toApiGatewayResponse(badRequest('Missing username'))

        const body = JSON.parse(event.body ?? '{}')
        const { senderName, senderEmail, message } = body
        if (!senderName || !senderEmail || !message) {
            return toApiGatewayResponse(badRequest('senderName, senderEmail, and message are required'))
        }

        // Rate limit: one contact per sender email per hour
        const rateLimit = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `RATELIMIT#${senderEmail}`, sk: 'CHECK' },
        }))
        if (rateLimit.Item) return toApiGatewayResponse(tooManyRequests('Please wait before sending another message'))

        // Find wayfarer by username
        const scan = await dynamo.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'sk = :sk AND username = :username',
            ExpressionAttributeValues: { ':sk': 'PROFILE', ':username': username },
        }))

        const profile = scan.Items?.[0]
        if (!profile) return toApiGatewayResponse(notFound('User not found'))

        // Write rate-limit record before sending to prevent double-sends on retry
        const ttl = Math.floor(Date.now() / 1000) + RATE_LIMIT_TTL_SECONDS
        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: { pk: `RATELIMIT#${senderEmail}`, sk: 'CHECK', ttl },
        }))

        await ses.send(new SendEmailCommand({
            FromEmailAddress: process.env.SES_FROM_EMAIL,
            Destination: { ToAddresses: [profile.email as string] },
            ConfigurationSetName: process.env.SES_CONFIGURATION_SET,
            Content: {
                Simple: {
                    Subject: { Data: 'New message on Cairn', Charset: 'UTF-8' },
                    Body: {
                        Text: {
                            Data: `You have a new message from ${senderName} (${senderEmail}):\n\n${message}`,
                            Charset: 'UTF-8',
                        },
                    },
                },
            },
        }))

        return toApiGatewayResponse(created({ success: true }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
