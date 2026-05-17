import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { toApiGatewayResponse, noContent, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const systemId = event.pathParameters?.id
        const planetId = event.pathParameters?.planetId

        if (!systemId || !planetId) {
            return toApiGatewayResponse(badRequest('Missing system or planet id'))
        }

        const getResult = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: 'SF#SYSTEM', sk: `SYSTEM#${systemId}` },
        }))

        if (!getResult.Item) {
            return toApiGatewayResponse(notFound('System not found'))
        }

        const planets: { id: string; name: string }[] = getResult.Item.planets ?? []
        const filtered = planets.filter(p => p.id !== planetId)

        await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: 'SF#SYSTEM', sk: `SYSTEM#${systemId}` },
            UpdateExpression: 'SET planets = :planets',
            ExpressionAttributeValues: { ':planets': filtered },
        }))

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
