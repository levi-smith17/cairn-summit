import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')

        if (!body.name || !body.species) {
            return toApiGatewayResponse(badRequest('name and species are required'))
        }

        const pk = getPk(event)
        const id = randomUUID()
        const sk = `COMPANION#${id}`

        const item = {
            pk,
            sk,
            id,
            name: body.name,
            species: body.species,
            passed: body.passed ?? false,
            ...(body.breed !== undefined ? { breed: body.breed } : {}),
            ...(body.birthday !== undefined ? { birthday: body.birthday } : {}),
            ...(body.bio !== undefined ? { bio: body.bio } : {}),
            createdAt: new Date().toISOString(),
        }

        await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))

        return toApiGatewayResponse(created(item))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
