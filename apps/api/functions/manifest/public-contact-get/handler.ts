import { GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { toApiGatewayResponse, badRequest, forbidden, notFound, serverError } from '../../shared/response'
import { resolveRequesterAccess } from '../../shared/optional-auth'
import { canViewPublicManifest, getManifestVisibility } from '../../shared/manifest-visibility'

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
        const ownerId = pk.replace('USER#', '')

        const [settingsResult, requester] = await Promise.all([
            dynamo.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: { pk, sk: 'SETTINGS' },
            })),
            resolveRequesterAccess(event),
        ])

        const settings = settingsResult.Item ?? {}
        const visibility = getManifestVisibility(settings as Record<string, unknown>)

        if (!canViewPublicManifest({
            visibility,
            isOwner: requester.userId === ownerId,
            isAdmin: requester.isAdmin,
        })) {
            return toApiGatewayResponse(forbidden('This manifest is private'))
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
            },
            body: JSON.stringify({
                wayfarer: {
                    name: profile.name ?? null,
                    email: profile.email ?? null,
                    image: profile.image ?? null,
                    defaultTerminology: settings.defaultTerminology ?? 'CAIRN',
                    defaultTheme: settings.defaultTheme ?? 'SYSTEM',
                },
            }),
        }
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
