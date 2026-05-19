import { GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, forbidden, serverError } from '../../shared/response'

async function scanProfiles(): Promise<any[]> {
    const items: any[] = []
    let lastKey: Record<string, any> | undefined
    do {
        const res = await dynamo.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'sk = :sk',
            ExpressionAttributeValues: { ':sk': 'PROFILE' },
            ExclusiveStartKey: lastKey,
        }))
        items.push(...(res.Items ?? []))
        lastKey = res.LastEvaluatedKey
    } while (lastKey)
    return items
}

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const pk = getPk(event)

        const profileRes = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: 'PROFILE' },
        }))
        if (!profileRes.Item?.isAdmin) return toApiGatewayResponse(forbidden('Admin access required'))

        const [profileItems, invRes, actRes] = await Promise.all([
            scanProfiles(),
            dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': 'ADMIN', ':prefix': 'INVITATION#' },
            })),
            dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': 'ADMIN', ':prefix': 'ACTIVITY#' },
                ScanIndexForward: false,
                Limit: 50,
            })),
        ])

        const wayfarers = profileItems.map((item: any) => ({
            id: item.pk.replace('USER#', ''),
            name: item.name ?? null,
            email: item.email ?? null,
            username: item.username ?? null,
            customDomain: item.customDomain ?? null,
            isAdmin: item.isAdmin ?? false,
            listed: item.listed ?? false,
            createdAt: item.createdAt,
        }))

        const invitations = (invRes.Items ?? []).map((item: any) => ({
            id: item.sk.replace('INVITATION#', ''),
            email: item.email,
            note: item.note ?? null,
            invitedBy: { name: item.invitedByName ?? null, email: item.invitedByEmail ?? null },
            expiresAt: item.expiresAt,
            usedAt: item.usedAt ?? null,
            createdAt: item.createdAt,
            token: item.token ?? null,
        }))

        const activities = (actRes.Items ?? []).map((item: any) => ({
            id: item.id,
            action: item.action,
            targetId: item.targetId ?? null,
            targetEmail: item.targetEmail ?? null,
            metadata: item.metadata ?? null,
            createdAt: item.createdAt,
            admin: { name: item.adminName ?? null, email: item.adminEmail ?? null },
        }))

        return toApiGatewayResponse(ok({ wayfarers, invitations, activities }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
