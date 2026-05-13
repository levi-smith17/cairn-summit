import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Cache } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')

        if (!body.markerId || body.limit === undefined || body.month === undefined || body.year === undefined) {
            return toApiGatewayResponse(badRequest('markerId, limit, month, and year are required'))
        }

        const pk = getPk(event)
        const id = randomUUID()
        const sk = `CACHE#${body.markerId}#${body.month}#${body.year}`

        const cache: Cache & { id: string } = {
            pk,
            sk,
            id,
            markerId: body.markerId,
            markerName: body.markerName ?? '',
            limit: body.limit,
            month: body.month,
            year: body.year,
        }

        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: cache,
        }))

        return toApiGatewayResponse(created(cache))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
