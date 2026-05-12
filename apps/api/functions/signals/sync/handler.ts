import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')
        if (!body.since) return toApiGatewayResponse(badRequest('since is required'))

        const sinceTime = new Date(body.since).getTime()
        if (isNaN(sinceTime)) return toApiGatewayResponse(badRequest('since must be a valid ISO timestamp'))

        const pk = getPk(event)

        // Query only main signals (exclude replies) using FilterExpression
        const result = await dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            FilterExpression: 'NOT contains(sk, :replyMarker)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'SIGNAL#',
                ':replyMarker': '#REPLY#',
            },
        }))

        const signals = result.Items ?? []

        const unreadCount = signals.filter(s => !s.read).length

        const newSignals = signals
            .filter(s => new Date(s.createdAt).getTime() > sinceTime)
            .map(s => ({
                id: s.sk.split('#')[1],
                senderName: s.senderName,
                body: s.body,
                read: s.read,
                createdAt: s.createdAt,
            }))

        return toApiGatewayResponse(ok({ unreadCount, signals: newSignals }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
