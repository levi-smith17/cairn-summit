import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Marker } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'

function markerIdFromSk(sk: string): string {
    return sk.replace('MARKER#', '')
}

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const pk = getPk(event)

        const [markersResult, waypointsResult] = await Promise.all([
            dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':prefix': 'MARKER#',
                },
            })),
            dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':prefix': 'WAYPOINT#',
                },
            })),
        ])

        const waypointCounts = new Map<string, number>()
        for (const waypoint of waypointsResult.Items ?? []) {
            for (const marker of (waypoint.markers ?? []) as Array<{ markerId?: string; id?: string }>) {
                const id = marker.markerId ?? marker.id
                if (!id) continue
                waypointCounts.set(id, (waypointCounts.get(id) ?? 0) + 1)
            }
        }

        const markers = ((markersResult.Items ?? []) as Marker[]).map(marker => ({
            ...marker,
            waypointCount: waypointCounts.get(markerIdFromSk(marker.sk)) ?? 0,
        }))

        return toApiGatewayResponse(ok(markers))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
