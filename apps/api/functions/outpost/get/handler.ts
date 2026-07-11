import { ScanCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'
import { resolveRequesterAccess } from '../../shared/optional-auth'
import { getManifestVisibility, isListedInOutpost } from '../../shared/manifest-visibility'

// Max items DynamoDB examines per Scan page — prevents unbounded table scans
const SCAN_PAGE_SIZE = 1000

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    try {
        const { isAdmin } = await resolveRequesterAccess(event)

        const rawCursor = event.queryStringParameters?.cursor
        const exclusiveStartKey = rawCursor
            ? JSON.parse(Buffer.from(rawCursor, 'base64url').toString('utf8'))
            : undefined

        const scanResult = await dynamo.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'sk = :sk',
            ExpressionAttributeValues: { ':sk': 'PROFILE' },
            Limit: SCAN_PAGE_SIZE,
            ExclusiveStartKey: exclusiveStartKey,
        }))

        const profiles = scanResult.Items ?? []

        const wayfarers = (
            await Promise.all(
                profiles.map(async (profile) => {
                    const pk = profile.pk as string
                    const userId = pk.replace('USER#', '')

                    const [settingsResult, expeditionResult, gearResult] = await Promise.all([
                        dynamo.send(new GetCommand({
                            TableName: TABLE_NAME,
                            Key: { pk, sk: 'SETTINGS' },
                        })),
                        dynamo.send(new QueryCommand({
                            TableName: TABLE_NAME,
                            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                            ExpressionAttributeValues: { ':pk': pk, ':prefix': 'EXPEDITION#' },
                            Select: 'COUNT',
                        })),
                        dynamo.send(new QueryCommand({
                            TableName: TABLE_NAME,
                            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                            ExpressionAttributeValues: { ':pk': pk, ':prefix': 'GEAR#' },
                        })),
                    ])

                    const visibility = getManifestVisibility(settingsResult.Item as Record<string, unknown> | undefined)
                    if (!isListedInOutpost({
                        listed: profile.listed as boolean | undefined,
                        visibility,
                        isAdmin,
                    })) {
                        return null
                    }

                    const topGear = (gearResult.Items ?? [])
                        .map((g: Record<string, unknown>) => g.name as string)
                        .filter(Boolean)
                        .slice(0, 5)

                    return {
                        id: userId,
                        name: (profile.name ?? null) as string | null,
                        email: (profile.email ?? null) as string | null,
                        image: (profile.image ?? null) as string | null,
                        username: (profile.username ?? null) as string | null,
                        location: (profile.location ?? null) as string | null,
                        expeditionCount: expeditionResult.Count ?? 0,
                        topGear,
                        memberSince: profile.createdAt as string,
                    }
                })
            )
        ).filter((w): w is NonNullable<typeof w> => w !== null)

        const nextCursor = scanResult.LastEvaluatedKey
            ? Buffer.from(JSON.stringify(scanResult.LastEvaluatedKey)).toString('base64url')
            : null

        return toApiGatewayResponse(ok({ wayfarers, nextCursor }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
