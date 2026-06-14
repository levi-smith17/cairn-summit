import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = event.pathParameters?.id
        if (!id) return toApiGatewayResponse(badRequest('Missing id'))

        const pk = getPk(event)

        const [guideResult, stonesResult] = await Promise.all([
            dynamo.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: { pk, sk: `GUIDE#${id}` },
            })),
            dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':prefix': `STONE#${id}#`,
                },
            })),
        ])

        const guide = guideResult.Item
        if (!guide) return toApiGatewayResponse(notFound('Guide not found'))

        const stones = (stonesResult.Items ?? []).map(stone => ({
            id: stone.sk.split('#').pop(),
            face: stone.face,
            core: stone.core,
            placement: stone.placement,
            markers: stone.markers ?? [],
        }))

        return toApiGatewayResponse(ok({
            pk: guide.pk,
            sk: guide.sk,
            id,
            name: guide.name,
            description: guide.description,
            trailId: guide.trailId,
            createdAt: guide.createdAt,
            stones,
        }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
