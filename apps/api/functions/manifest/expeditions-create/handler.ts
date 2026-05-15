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

        if (!body.title || !body.company || !body.startDate) {
            return toApiGatewayResponse(badRequest('title, company, and startDate are required'))
        }

        const pk = getPk(event)
        const id = randomUUID()
        const sk = `EXPEDITION#${id}`

        const item = {
            pk,
            sk,
            id,
            title: body.title,
            company: body.company,
            startDate: body.startDate,
            current: body.current ?? false,
            ...(body.location !== undefined ? { location: body.location } : {}),
            ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
            createdAt: new Date().toISOString(),
        }

        await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))

        return toApiGatewayResponse(created(item))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
