import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getUserId } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

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
        const sort = qs.sort ?? 'newest'

        // Use GSI to efficiently fetch only waypoints for this trail
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

        // Verify the trail belongs to this user by checking waypoint pk
        const rawWaypoints = (waypointsResult.Items ?? []).filter(
            (w: any) => w.pk === `USER#${userId}`
        )

        const logsByWaypoint = new Map<string, any[]>()
        for (const log of logsResult.Items ?? []) {
            if (!log.waypointId) continue
            if (!logsByWaypoint.has(log.waypointId)) logsByWaypoint.set(log.waypointId, [])
            logsByWaypoint.get(log.waypointId)!.push({
                id: (log.sk as string).split('#').pop(),
                content: log.content ?? '',
                createdAt: log.createdAt,
            })
        }

        let waypoints = rawWaypoints.map((w: any) => ({
            id: (w.sk as string).split('#').pop() as string,
            title: w.title as string,
            url: w.url as string,
            favicon: w.favicon ?? null,
            read: w.read ?? false,
            readLater: w.readLater ?? false,
            trailId: w.trailId ?? null,
            markers: (w.markers ?? []).map((m: any) => ({
                markerId: m.id,
                marker: { id: m.id, name: m.name, color: m.color, icon: m.icon ?? null },
            })),
            createdAt: w.createdAt as string,
            logs: (logsByWaypoint.get((w.sk as string).split('#').pop()!) ?? [])
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3),
        }))

        if (sort === 'oldest') {
            waypoints.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        } else if (sort === 'alpha') {
            waypoints.sort((a, b) => a.title.localeCompare(b.title))
        } else {
            waypoints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }

        const filteredCount = waypoints.length
        const skip = (page - 1) * pageSize
        const paged = waypoints.slice(skip, skip + pageSize)

        return toApiGatewayResponse(ok({ waypoints: paged, filteredCount }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
