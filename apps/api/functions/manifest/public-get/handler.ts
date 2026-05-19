import { GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { toApiGatewayResponse, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    try {
        const username = event.pathParameters?.username
        if (!username) return toApiGatewayResponse(badRequest('username is required'))

        // Scan is acceptable — low-frequency public endpoint, small table
        const scan = await dynamo.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'sk = :sk AND username = :username',
            ExpressionAttributeValues: { ':sk': 'PROFILE', ':username': username },
        }))

        const profile = scan.Items?.[0]
        if (!profile) return toApiGatewayResponse(notFound('User not found'))

        const pk = profile.pk as string

        const [
            settingsResult,
            expeditionsResult,
            trainingResult,
            gearResult,
            landmarksResult,
            summitsResult,
            pathfindingResult,
        ] = await Promise.all([
            dynamo.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk: 'SETTINGS' } })),
            dynamo.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'EXPEDITION#' } })),
            dynamo.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'TRAINING#' } })),
            dynamo.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'GEAR#' } })),
            dynamo.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'LANDMARK#' } })),
            dynamo.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'SUMMIT#' } })),
            dynamo.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'PATHFINDING#' } })),
        ])

        const settings = settingsResult.Item ?? {}

        const addId = (items: Record<string, unknown>[], prefix: string) =>
            items.map(item => ({ ...item, id: (item.sk as string).replace(`${prefix}#`, '') }))

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
            },
            body: JSON.stringify({
                wayfarer: {
                    username: profile.username ?? null,
                    name: profile.name ?? null,
                    email: profile.email ?? null,
                    image: profile.image ?? null,
                    defaultTerminology: settings.defaultTerminology ?? 'CAIRN',
                    defaultTheme: settings.defaultTheme ?? 'SYSTEM',
                },
                origins: {
                    headline: profile.headline ?? null,
                    summary: profile.summary ?? null,
                    bio: profile.bio ?? null,
                    location: profile.location ?? null,
                    website: profile.website ?? null,
                    linkedin: profile.linkedin ?? null,
                    github: profile.github ?? null,
                },
                expeditions: addId(expeditionsResult.Items ?? [], 'EXPEDITION'),
                training: addId(trainingResult.Items ?? [], 'TRAINING'),
                gear: addId(gearResult.Items ?? [], 'GEAR'),
                landmarks: addId(landmarksResult.Items ?? [], 'LANDMARK'),
                summits: addId(summitsResult.Items ?? [], 'SUMMIT'),
                pathfinding: addId(pathfindingResult.Items ?? [], 'PATHFINDING'),
            }),
        }
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
