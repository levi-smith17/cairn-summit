import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const pk = getPk(event)

        const [
            profileResult,
            expeditionsResult,
            trainingResult,
            gearResult,
            landmarksResult,
            summitsResult,
            pathfindingResult,
            companionsResult,
        ] = await Promise.all([
            dynamo.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk: 'PROFILE' } })),
            dynamo.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'EXPEDITION#' } })),
            dynamo.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'TRAINING#' } })),
            dynamo.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'GEAR#' } })),
            dynamo.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'LANDMARK#' } })),
            dynamo.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'SUMMIT#' } })),
            dynamo.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'PATHFINDING#' } })),
            dynamo.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'COMPANION#' } })),
        ])

        const profile = profileResult.Item ?? {}

        const addId = (items: Record<string, unknown>[], prefix: string) =>
            items.map(item => ({
                ...item,
                id: (item.sk as string).replace(`${prefix}#`, ''),
            }))

        return toApiGatewayResponse(ok({
            user: {
                name: profile.name ?? null,
                email: profile.email ?? null,
                image: profile.image ?? null,
            },
            username: profile.username ?? null,
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
            companions: addId(companionsResult.Items ?? [], 'COMPANION'),
        }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
