import { BatchWriteCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

interface StoneInput {
    face: string
    core: string
    markerIds: string[]
}

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const guideId = event.pathParameters?.guideId

        if (!guideId) {
            return toApiGatewayResponse(badRequest('Missing guideId'))
        }

        const body = JSON.parse(event.body ?? '{}')
        const stones: StoneInput[] = body.stones ?? []

        if (stones.length === 0) {
            return toApiGatewayResponse(badRequest('stones array is required and must not be empty'))
        }

        const pk = getPk(event)

        const allMarkerIds = [...new Set(stones.flatMap(s => s.markerIds ?? []))]
        const markerMap = new Map<string, unknown>()

        if (allMarkerIds.length > 0) {
            for (let i = 0; i < allMarkerIds.length; i += 100) {
                const chunk = allMarkerIds.slice(i, i + 100)
                const batchResult = await dynamo.send(new BatchGetCommand({
                    RequestItems: {
                        [TABLE_NAME]: {
                            Keys: chunk.map(mid => ({ pk, sk: `MARKER#${mid}` })),
                        },
                    },
                }))
                for (const m of (batchResult.Responses?.[TABLE_NAME] ?? [])) {
                    const mid = m.sk.split('#').pop()!
                    markerMap.set(mid, {
                        id: mid,
                        name: m.name,
                        color: m.color,
                        ...(m.icon !== undefined && { icon: m.icon }),
                    })
                }
            }
        }

        const now = new Date().toISOString()
        const items = stones.map(stone => {
            const stoneId = randomUUID()
            const markers = (stone.markerIds ?? [])
                .map(mid => markerMap.get(mid))
                .filter(Boolean)
            return {
                pk,
                sk: `STONE#${guideId}#${stoneId}`,
                guideId,
                face: stone.face,
                core: stone.core,
                placement: 'UNPLACED' as const,
                markers,
                createdAt: now,
            }
        })

        for (let i = 0; i < items.length; i += 25) {
            const chunk = items.slice(i, i + 25)
            await dynamo.send(new BatchWriteCommand({
                RequestItems: {
                    [TABLE_NAME]: chunk.map(item => ({
                        PutRequest: { Item: item },
                    })),
                },
            }))
        }

        return toApiGatewayResponse(ok({ count: items.length }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
