import { PutCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { randomUUID } from 'crypto'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')

        if (!body.name || !body.url) {
            return toApiGatewayResponse(badRequest('name and url are required'))
        }

        const pk = getPk(event)
        const id = randomUUID()
        const sk = `ITINERARY_SUB#${id}`
        const now = new Date().toISOString()

        const item = {
            pk,
            sk,
            name: body.name,
            url: body.url,
            color: body.color ?? '#34C759',
            syncEnabled: body.syncEnabled ?? true,
            createdAt: now,
        }

        await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))

        return toApiGatewayResponse(created({ ...item, id }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
