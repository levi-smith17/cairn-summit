import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getUserId } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'
import { parseWaypointFilterParams, filterWaypoints, sortWaypoints } from '../waypoint-filters'

const DEFAULT_PAGE_SIZE = 5

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const qs = event.queryStringParameters ?? {}
        const trailId = qs.trailId
        if (!trailId) return toApiGatewayResponse(badRequest('trailId is required'))

        const pk = getPk(event)
        const userId = getUserId(event)
        const page = Math.max(1, parseInt(qs.page ?? '1', 10))
        const pageSize = Math.min(50, Math.max(1, parseInt(qs.pageSize ?? String(DEFAULT_PAGE_SIZE), 10)))
        const filterParams = parseWaypointFilterParams(qs)

        const [waypointsResult, logsResult] = await Promise.all([
            dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: 'gsi1',
                KeyConditionExpression: 'gsi1pk = :gsi1pk',
                ExpressionAttributeValues: { ':gsi1pk': `TRAIL#${trailId}` },
            })),
            dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': pk, ':prefix': 'LOG#' },
            })),
        ])

        const rawWaypoints = (waypointsResult.Items ?? []).filter(
            (w: { pk?: string }) => w.pk === `USER#${userId}`
        )

        const logsByWaypoint = new Map<string, { id: string; content: string; createdAt: string }[]>()
        for (const log of logsResult.Items ?? []) {
            if (!log.waypointId) continue
            const waypointId = log.waypointId as string
            if (!logsByWaypoint.has(waypointId)) logsByWaypoint.set(waypointId, [])
            logsByWaypoint.get(waypointId)!.push({
                id: (log.sk as string).split('#').pop()!,
                content: (log.content as string) ?? '',
                createdAt: log.createdAt as string,
            })
        }

        let waypoints = rawWaypoints.map((w: Record<string, unknown>) => {
            const id = (w.sk as string).split('#').pop() as string
            return {
                id,
                title: w.title as string,
                url: w.url as string,
                favicon: (w.favicon as string | null) ?? null,
                read: (w.read as boolean) ?? false,
                readLater: (w.readLater as boolean) ?? false,
                trailId: (w.trailId as string | null) ?? null,
                markers: ((w.markers as { id: string; name: string; color: string; icon?: string | null }[]) ?? []).map(m => ({
                    markerId: m.id,
                    marker: { id: m.id, name: m.name, color: m.color, icon: m.icon ?? null },
                })),
                createdAt: w.createdAt as string,
                logs: (logsByWaypoint.get(id) ?? [])
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 1),
            }
        })

        waypoints = sortWaypoints(filterWaypoints(waypoints, filterParams), filterParams.sort)

        const filteredCount = waypoints.length
        const skip = (page - 1) * pageSize
        const paged = waypoints.slice(skip, skip + pageSize)

        return toApiGatewayResponse(ok({ waypoints: paged, filteredCount }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
