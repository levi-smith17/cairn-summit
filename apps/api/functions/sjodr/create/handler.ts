import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Sjodr } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')

        if (!body.name?.trim()) {
            return toApiGatewayResponse(badRequest('name is required'))
        }

        const pk = getPk(event)
        const id = randomUUID()
        const sk = `SJODR#${id}`

        const sjodr: Sjodr = {
            pk,
            sk,
            name: body.name.trim(),
            ...(body.description?.trim() ? { description: body.description.trim() } : {}),
            createdAt: new Date().toISOString(),
        }

        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                ...sjodr,
                gsi1pk: pk,
                gsi1sk: sk,
            },
        }))

        return toApiGatewayResponse(created(sjodr))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
