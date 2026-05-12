import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { SignalReply } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { toApiGatewayResponse, created, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    try {
        const token = event.pathParameters?.token
        if (!token) return toApiGatewayResponse(badRequest('Missing token'))

        const body = JSON.parse(event.body ?? '{}')
        if (!body.body) return toApiGatewayResponse(badRequest('body is required'))

        // Resolve token
        const tokenItem = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: 'TOKEN', sk: token },
        }))

        if (!tokenItem.Item) return toApiGatewayResponse(notFound('Thread not found'))

        const { userPk, signalId, tokenExpiresAt } = tokenItem.Item as {
            userPk: string
            signalId: string
            tokenExpiresAt: string
        }

        if (new Date(tokenExpiresAt) < new Date()) {
            return toApiGatewayResponse(badRequest('Reply link has expired'))
        }

        const replyId = randomUUID()
        const sk = `SIGNAL#${signalId}#REPLY#${replyId}`

        const reply: SignalReply = {
            pk: userPk,
            sk,
            body: body.body,
            direction: 'INBOUND',
            createdAt: new Date().toISOString(),
        }

        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: reply,
        }))

        return toApiGatewayResponse(created({
            id: replyId,
            body: reply.body,
            direction: reply.direction,
            createdAt: reply.createdAt,
        }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
