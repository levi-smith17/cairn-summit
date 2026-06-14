import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { createContactSignal } from '../../shared/signals'
import { toApiGatewayResponse, created, badRequest, notFound, tooManyRequests, serverError } from '../../shared/response'

const RATE_LIMIT_TTL_SECONDS = 3600

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    try {
        const username = event.pathParameters?.username
        if (!username) return toApiGatewayResponse(badRequest('Missing username'))

        const parsed = JSON.parse(event.body ?? '{}')
        const { senderName, senderEmail, body: message } = parsed
        if (!senderName || !senderEmail || !message) {
            return toApiGatewayResponse(badRequest('senderName, senderEmail, and body are required'))
        }

        const rateLimit = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: `RATELIMIT#${senderEmail}`, sk: 'CHECK' },
        }))
        if (rateLimit.Item) return toApiGatewayResponse(tooManyRequests('Please wait before sending another message'))

        const ttl = Math.floor(Date.now() / 1000) + RATE_LIMIT_TTL_SECONDS
        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: { pk: `RATELIMIT#${senderEmail}`, sk: 'CHECK', ttl },
        }))

        const result = await createContactSignal({
            username,
            senderName,
            senderEmail,
            body: message,
        })

        if (!result) return toApiGatewayResponse(notFound('User not found'))

        return toApiGatewayResponse(created({
            id: result.id,
            threadUrl: result.threadUrl,
        }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
