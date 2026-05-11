import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Marker } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')

        if (!body.name || !body.color) {
            return toApiGatewayResponse(badRequest('name and color are required'))
        }

        const pk = getPk(event)
        const marker: Marker = {
            pk,
            sk: `MARKER#${randomUUID()}`,
            name: body.name,
            color: body.color,
            icon: body.icon ?? undefined,
            createdAt: new Date().toISOString(),
        }

        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: marker,
        }))

        return toApiGatewayResponse(created(marker))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}