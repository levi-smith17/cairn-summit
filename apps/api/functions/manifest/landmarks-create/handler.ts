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

        if (!body.name) {
            return toApiGatewayResponse(badRequest('name is required'))
        }

        const pk = getPk(event)
        const id = randomUUID()
        const sk = `LANDMARK#${id}`

        const item = {
            pk,
            sk,
            id,
            name: body.name,
            current: body.current ?? false,
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.url !== undefined ? { url: body.url } : {}),
            ...(body.githubUrl !== undefined ? { githubUrl: body.githubUrl } : {}),
            ...(body.startDate !== undefined ? { startDate: body.startDate } : {}),
            ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
            createdAt: new Date().toISOString(),
        }

        await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))

        return toApiGatewayResponse(created(item))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
