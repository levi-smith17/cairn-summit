import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const systemId = event.pathParameters?.id

        if (!systemId) {
            return toApiGatewayResponse(badRequest('Missing system id'))
        }

        const body = JSON.parse(event.body ?? '{}')

        if (!body.name) {
            return toApiGatewayResponse(badRequest('name is required'))
        }

        const planet = {
            id: body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: body.name,
        }

        await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: 'SF#SYSTEM', sk: `SYSTEM#${systemId}` },
            UpdateExpression: 'SET planets = list_append(if_not_exists(planets, :empty), :planet)',
            ExpressionAttributeValues: {
                ':planet': [planet],
                ':empty': [],
            },
        }))

        return toApiGatewayResponse(created(planet))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
