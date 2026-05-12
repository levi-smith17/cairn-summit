import { BatchGetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Waypoint, EmbeddedMarker } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

async function resolveMarkers(pk: string, markerIds: string[]): Promise<EmbeddedMarker[]> {
    if (!markerIds.length) return []

    const result = await dynamo.send(new BatchGetCommand({
        RequestItems: {
            [TABLE_NAME]: {
                Keys: markerIds.map(mid => ({ pk, sk: `MARKER#${mid}` })),
            },
        },
    }))

    return (result.Responses?.[TABLE_NAME] ?? []).map((m: any) => ({
        id: m.sk.split('#').pop() as string,
        name: m.name as string,
        color: m.color as string,
        ...(m.icon ? { icon: m.icon as string } : {}),
    }))
}

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')

        if (!body.url || !body.title) {
            return toApiGatewayResponse(badRequest('url and title are required'))
        }

        const pk = getPk(event)
        const id = randomUUID()
        const sk = `WAYPOINT#${id}`

        const markers = await resolveMarkers(pk, Array.isArray(body.markerIds) ? body.markerIds : [])

        const waypoint: Waypoint = {
            pk,
            sk,
            url: body.url,
            title: body.title,
            ...(body.description ? { description: body.description } : {}),
            ...(body.favicon ? { favicon: body.favicon } : {}),
            ...(body.notes ? { notes: body.notes } : {}),
            read: false,
            readLater: false,
            ...(body.trailId ? { trailId: body.trailId } : {}),
            markers,
            createdAt: new Date().toISOString(),
        }

        const item: Record<string, unknown> = { ...waypoint }
        if (body.trailId) {
            item.gsi1pk = `TRAIL#${body.trailId}`
            item.gsi1sk = sk
        }

        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
        }))

        return toApiGatewayResponse(created(waypoint))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
