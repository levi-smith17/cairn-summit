import { QueryCommand, UpdateCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = getPathId(event)

        if (!id) {
            return toApiGatewayResponse(badRequest('Missing stone id'))
        }

        const body = JSON.parse(event.body ?? '{}')
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

        const setExpressions: string[] = []
        const expressionAttributeValues: Record<string, unknown> = {}

        if (body.face !== undefined) {
            setExpressions.push('face = :face')
            expressionAttributeValues[':face'] = body.face
        }

        if (body.core !== undefined) {
            setExpressions.push('core = :core')
            expressionAttributeValues[':core'] = body.core
        }

        if (body.markerIds !== undefined) {
            let markers: unknown[] = []
            const markerIds: string[] = body.markerIds

            if (markerIds.length > 0) {
                const batchResult = await dynamo.send(new BatchGetCommand({
                    RequestItems: {
                        [TABLE_NAME]: {
                            Keys: markerIds.map(mid => ({ pk, sk: `MARKER#${mid}` })),
                        },
                    },
                }))
                const rawMarkers = batchResult.Responses?.[TABLE_NAME] ?? []
                markers = rawMarkers.map(m => ({
                    id: m.sk.split('#').pop(),
                    name: m.name,
                    color: m.color,
                    ...(m.icon !== undefined && { icon: m.icon }),
                }))
            }

            setExpressions.push('markers = :markers')
            expressionAttributeValues[':markers'] = markers
        }

        if (setExpressions.length === 0) {
            return toApiGatewayResponse(badRequest('No fields to update'))
        }

        const result = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: stone.pk, sk: stone.sk },
            UpdateExpression: `SET ${setExpressions.join(', ')}`,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        }))

        return toApiGatewayResponse(ok(result.Attributes))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
