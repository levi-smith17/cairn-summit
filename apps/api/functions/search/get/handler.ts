import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

type SearchResultType = 'waypoint' | 'log' | 'provision' | 'stop' | 'trail' | 'marker'

interface SearchResult {
    id: string
    type: SearchResultType
    title: string
    subtitle?: string
    url: string
    externalUrl?: string
    color?: string
    score: number
}

function extractId(sk: string): string {
    return sk.split('#').pop() ?? sk
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function matchesQuery(text: string | undefined | null, query: string): boolean {
    return (text ?? '').toLowerCase().includes(query)
}

function scoreMatch(titleMatch: boolean, bodyMatch: boolean): number {
    if (titleMatch) return 2
    if (bodyMatch) return 1
    return 0
}

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const query = event.queryStringParameters?.q?.trim().toLowerCase()
        if (!query) return toApiGatewayResponse(badRequest('q query parameter is required'))

        const deep = event.queryStringParameters?.deep === 'true'
        const pk = getPk(event)

        const prefixes: { prefix: string; type: SearchResultType }[] = [
            { prefix: 'WAYPOINT#', type: 'waypoint' },
            { prefix: 'LOG#', type: 'log' },
            { prefix: 'SUPPLYLINE#', type: 'provision' },
            { prefix: 'TRAIL#', type: 'trail' },
            { prefix: 'MARKER#', type: 'marker' },
            { prefix: 'STOP#', type: 'stop' },
        ]

        const queryResults = await Promise.all(
            prefixes.map(({ prefix }) =>
                dynamo.send(new QueryCommand({
                    TableName: TABLE_NAME,
                    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                    ExpressionAttributeValues: { ':pk': pk, ':prefix': prefix },
                }))
            )
        )

        const results: SearchResult[] = []

        for (let i = 0; i < prefixes.length; i++) {
            const { type } = prefixes[i]
            for (const item of queryResults[i].Items ?? []) {
                const id = extractId(item.sk as string)

                if (type === 'waypoint') {
                    const titleMatch = matchesQuery(item.title as string, query)
                    const bodyMatch = matchesQuery(item.url as string, query)
                        || matchesQuery(item.description as string, query)
                        || matchesQuery(item.notes as string, query)
                    const score = scoreMatch(titleMatch, bodyMatch)
                    if (!score) continue
                    results.push({
                        id,
                        type,
                        title: (item.title as string) || (item.url as string),
                        subtitle: item.url as string,
                        url: `/waypoints?id=${id}`,
                        externalUrl: item.url as string,
                        score,
                    })
                } else if (type === 'log') {
                    const plainContent = stripHtml((item.content as string) ?? '')
                    const titleMatch = matchesQuery(item.title as string, query)
                    const bodyMatch = deep && matchesQuery(plainContent, query)
                    const score = scoreMatch(titleMatch, bodyMatch)
                    if (!score) continue
                    results.push({
                        id,
                        type,
                        title: (item.title as string) || 'Untitled log',
                        url: `/logs?id=${id}`,
                        score,
                    })
                } else if (type === 'provision') {
                    const titleMatch = matchesQuery(item.name as string, query)
                    if (!titleMatch) continue
                    results.push({
                        id,
                        type,
                        title: item.name as string,
                        url: '/provisions',
                        score: 2,
                    })
                } else if (type === 'trail') {
                    const titleMatch = matchesQuery(item.name as string, query)
                    if (!titleMatch) continue
                    results.push({
                        id,
                        type,
                        title: item.name as string,
                        url: '/trails',
                        score: 2,
                    })
                } else if (type === 'marker') {
                    const titleMatch = matchesQuery(item.name as string, query)
                    if (!titleMatch) continue
                    results.push({
                        id,
                        type,
                        title: item.name as string,
                        url: '/markers',
                        color: item.color as string | undefined,
                        score: 2,
                    })
                } else if (type === 'stop') {
                    const titleMatch = matchesQuery(item.title as string, query)
                        || matchesQuery(item.summary as string, query)
                    if (!titleMatch) continue
                    results.push({
                        id,
                        type,
                        title: (item.title as string) || 'Calendar event',
                        subtitle: item.summary as string | undefined,
                        url: '/itinerary',
                        score: 2,
                    })
                }
            }
        }

        results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))

        return toApiGatewayResponse(ok(results))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
