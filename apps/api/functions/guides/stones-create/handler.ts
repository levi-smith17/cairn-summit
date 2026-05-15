import { PutCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const guideId = event.pathParameters?.guideId

        if (!guideId) {
            return toApiGatewayResponse(badRequest('Missing guideId'))
        }

        const body = JSON.parse(event.body ?? '{}')

        if (!body.face || !body.core) {
            return toApiGatewayResponse(badRequest('face and core are required'))
        }

        const pk = getPk(event)
        const stoneId = randomUUID()
        const sk = `STONE#${guideId}#${stoneId}`

        let markers: unknown[] = []
        const markerIds: string[] = body.markerIds ?? []

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

        const stone = {
            pk,
            sk,
            guideId,
            face: body.face,
            core: body.core,
            placement: 'UNPLACED' as const,
            markers,
            createdAt: new Date().toISOString(),
        }

        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: stone,
        }))

        return toApiGatewayResponse(created({ ...stone, id: stoneId }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
