import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, notFound, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const pk = getPk(event)

        const [profileResult, signalResult, calendarsResult] = await Promise.all([
            dynamo.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: { pk, sk: 'PROFILE' },
            })),
            dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':prefix': 'SIGNAL#',
                },
            })),
            dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':prefix': 'ITINERARY#',
                },
                Select: 'COUNT',
            })),
        ])

        if (!profileResult.Item) return toApiGatewayResponse(notFound('Profile not found'))

        const profile = profileResult.Item

        const signals = (signalResult.Items ?? []).filter(
            s => !String(s.sk ?? '').includes('#REPLY#')
        )
        const unreadSignals = signals.filter(s => !s.read).length

        return toApiGatewayResponse(ok({
            username: profile.username ?? null,
            name: profile.name ?? null,
            email: profile.email ?? null,
            image: profile.image ?? null,
            isAdmin: profile.isAdmin ?? false,
            signals: unreadSignals,
            itinerary: calendarsResult.Count ?? 0,
        }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
