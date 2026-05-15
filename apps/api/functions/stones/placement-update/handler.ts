import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { toApiGatewayResponse, noContent, badRequest, notFound, serverError } from '../../shared/response'

const VALID_PLACEMENTS = ['UNPLACED', 'PLACED', 'SET', 'SEATED'] as const
type Placement = typeof VALID_PLACEMENTS[number]

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = getPathId(event)

        if (!id) {
            return toApiGatewayResponse(badRequest('Missing stone id'))
        }

        const body = JSON.parse(event.body ?? '{}')
        const placement: Placement = body.placement

        if (!placement || !VALID_PLACEMENTS.includes(placement)) {
            return toApiGatewayResponse(badRequest(`placement must be one of: ${VALID_PLACEMENTS.join(', ')}`))
        }

        const pk = getPk(event)

        const queryResult = await dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            FilterExpression: 'contains(sk, :suffix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'STONE#',
                ':suffix': `#${id}`,
            },
            Limit: 1,
        }))

        const stone = queryResult.Items?.[0]
        if (!stone) {
            return toApiGatewayResponse(notFound('Stone not found'))
        }

        await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: stone.pk, sk: stone.sk },
            UpdateExpression: 'SET placement = :placement',
            ExpressionAttributeValues: {
                ':placement': placement,
            },
        }))

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
