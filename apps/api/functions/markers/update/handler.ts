import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Marker } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = getPathId(event)

        if (!id) {
            return toApiGatewayResponse(badRequest('Missing marker id'))
        }

        const body = JSON.parse(event.body ?? '{}')

        if (!body.name || !body.color) {
            return toApiGatewayResponse(badRequest('name and color are required'))
        }

        const pk = getPk(event)

        const result = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `MARKER#${id}` },
            UpdateExpression: 'SET #name = :name, color = :color, icon = :icon',
            ExpressionAttributeNames: { '#name': 'name' },
            ExpressionAttributeValues: {
                ':name': body.name,
                ':color': body.color,
                ':icon': body.icon ?? null,
            },
            ReturnValues: 'ALL_NEW',
        }))

        return toApiGatewayResponse(ok(result.Attributes as Marker))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}