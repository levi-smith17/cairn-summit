import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { toApiGatewayResponse, ok, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const systemId = event.pathParameters?.id
        const planetId = event.pathParameters?.planetId

        if (!systemId || !planetId) {
            return toApiGatewayResponse(badRequest('Missing system or planet id'))
        }

        const body = JSON.parse(event.body ?? '{}')

        if (!body.name) {
            return toApiGatewayResponse(badRequest('name is required'))
        }

        const getResult = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: 'SF#SYSTEM', sk: `SYSTEM#${systemId}` },
        }))

        if (!getResult.Item) {
            return toApiGatewayResponse(notFound('System not found'))
        }

        const planets: { id: string; name: string }[] = getResult.Item.planets ?? []
        const idx = planets.findIndex(p => p.id === planetId)

        if (idx === -1) {
            return toApiGatewayResponse(notFound('Planet not found'))
        }

        const newId = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        planets[idx] = { id: newId, name: body.name }

        await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: 'SF#SYSTEM', sk: `SYSTEM#${systemId}` },
            UpdateExpression: 'SET planets = :planets',
            ExpressionAttributeValues: { ':planets': planets },
        }))

        return toApiGatewayResponse(ok(planets[idx]))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
