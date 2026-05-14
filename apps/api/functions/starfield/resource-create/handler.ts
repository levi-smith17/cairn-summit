import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')

        if (!body.name || !body.abbreviation || !body.type) {
            return toApiGatewayResponse(badRequest('name, abbreviation, and type are required'))
        }

        const id = randomUUID()
        const sk = `RESOURCE#${id}`

        const item = {
            pk: 'SF#RESOURCE',
            sk,
            name: body.name,
            abbreviation: body.abbreviation,
            type: body.type,
            tier: body.tier ?? null,
            mined: body.mined ?? false,
            ingredients: body.ingredients ?? [],
            createdAt: new Date().toISOString(),
        }

        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
        }))

        return toApiGatewayResponse(created(item))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
