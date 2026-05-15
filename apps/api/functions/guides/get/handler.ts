import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const pk = getPk(event)

        const [guidesResult, stonesResult] = await Promise.all([
            dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':prefix': 'GUIDE#',
                },
            })),
            dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':prefix': 'STONE#',
                },
            })),
        ])

        const stonesByGuideId = new Map<string, unknown[]>()
        for (const stone of (stonesResult.Items ?? [])) {
            const parts = stone.sk.split('#')
            const guideId = parts[1]
            const stoneId = parts[2]
            const mapped = {
                id: stoneId,
                face: stone.face,
                core: stone.core,
                placement: stone.placement,
                markers: stone.markers ?? [],
            }
            if (!stonesByGuideId.has(guideId)) {
                stonesByGuideId.set(guideId, [])
            }
            stonesByGuideId.get(guideId)!.push(mapped)
        }

        const guides = (guidesResult.Items ?? []).map(guide => {
            const id = guide.sk.split('#').pop()
            return {
                pk: guide.pk,
                sk: guide.sk,
                id,
                name: guide.name,
                description: guide.description,
                trailId: guide.trailId,
                createdAt: guide.createdAt,
                stones: stonesByGuideId.get(id!) ?? [],
            }
        })

        return toApiGatewayResponse(ok(guides))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
