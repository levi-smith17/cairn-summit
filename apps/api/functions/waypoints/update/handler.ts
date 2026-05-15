import { BatchGetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Waypoint, EmbeddedMarker } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

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
        const id = getPathId(event)

        if (!id) {
            return toApiGatewayResponse(badRequest('Missing waypoint id'))
        }

        const body = JSON.parse(event.body ?? '{}')

        const hasContentUpdate = 'title' in body || 'url' in body
        const hasReadUpdate = 'read' in body || 'readLater' in body

        if (hasContentUpdate && (!body.title || !body.url)) {
            return toApiGatewayResponse(badRequest('title and url are required'))
        }

        if (!hasContentUpdate && !hasReadUpdate) {
            return toApiGatewayResponse(badRequest('No valid fields to update'))
        }

        const pk = getPk(event)
        const sk = `WAYPOINT#${id}`

        const setExprs: string[] = []
        const removeExprs: string[] = []
        const exprNames: Record<string, string> = {}
        const exprValues: Record<string, unknown> = {}

        // Read/readLater can be updated independently of content fields
        if ('read' in body) {
            setExprs.push('#read = :read')
            exprNames['#read'] = 'read'
            exprValues[':read'] = body.read
        }

        if ('readLater' in body) {
            setExprs.push('readLater = :readLater')
            exprValues[':readLater'] = body.readLater
        }

        if (hasContentUpdate) {
            const markers = await resolveMarkers(pk, Array.isArray(body.markerIds) ? body.markerIds : [])

            setExprs.push('#title = :title', '#url = :url', 'markers = :markers')
            exprNames['#title'] = 'title'
            exprNames['#url'] = 'url'
            exprValues[':title'] = body.title
            exprValues[':url'] = body.url
            exprValues[':markers'] = markers

            if (body.description) {
                setExprs.push('description = :description')
                exprValues[':description'] = body.description
            } else {
                removeExprs.push('description')
            }

            if (body.notes) {
                setExprs.push('notes = :notes')
                exprValues[':notes'] = body.notes
            } else {
                removeExprs.push('notes')
            }

            if (body.favicon) {
                setExprs.push('favicon = :favicon')
                exprValues[':favicon'] = body.favicon
            } else {
                removeExprs.push('favicon')
            }

            if (body.trailId) {
                setExprs.push('trailId = :trailId', 'gsi1pk = :gsi1pk', 'gsi1sk = :gsi1sk')
                exprValues[':trailId'] = body.trailId
                exprValues[':gsi1pk'] = `TRAIL#${body.trailId}`
                exprValues[':gsi1sk'] = sk
            } else {
                removeExprs.push('trailId', 'gsi1pk', 'gsi1sk')
            }
        }

        const parts: string[] = []
        if (setExprs.length > 0) parts.push(`SET ${setExprs.join(', ')}`)
        if (removeExprs.length > 0) parts.push(`REMOVE ${removeExprs.join(', ')}`)
        const UpdateExpression = parts.join(' ')

        const result = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk },
            UpdateExpression,
            ...(Object.keys(exprNames).length > 0 ? { ExpressionAttributeNames: exprNames } : {}),
            ExpressionAttributeValues: exprValues,
            ReturnValues: 'ALL_NEW',
        }))

        return toApiGatewayResponse(ok(result.Attributes as Waypoint))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
