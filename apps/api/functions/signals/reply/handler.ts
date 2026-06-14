import { PutCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { randomUUID } from 'crypto'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const signalId = getPathId(event)
        if (!signalId) return toApiGatewayResponse(badRequest('Missing signal id'))

        const body = JSON.parse(event.body ?? '{}')
        if (!body.body) return toApiGatewayResponse(badRequest('body is required'))

        const pk = getPk(event)
        const replyId = randomUUID()
        const sk = `SIGNAL#${signalId}#REPLY#${replyId}`
        const reply = {
            pk,
            sk,
            body: body.body,
            direction: 'OUTBOUND',
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
            senderName: null,
            senderEmail: null,
            createdAt: reply.createdAt,
        }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
