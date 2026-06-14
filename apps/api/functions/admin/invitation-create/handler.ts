import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { writeInviteLookup } from '../../shared/invites'
import { toApiGatewayResponse, created, badRequest, forbidden, serverError } from '../../shared/response'

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

        const body = JSON.parse(event.body ?? '{}')
        if (!body.email) return toApiGatewayResponse(badRequest('email is required'))

        const id = randomUUID()
        const token = randomUUID()
        const now = new Date().toISOString()
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: 'ADMIN',
                sk: `INVITATION#${id}`,
                id,
                token,
                email: body.email,
                note: body.note ?? null,
                invitedByName: profileRes.Item.name ?? null,
                invitedByEmail: profileRes.Item.email ?? null,
                expiresAt,
                usedAt: null,
                createdAt: now,
            },
        }))

        await writeInviteLookup(token, id)

        try {
            await dynamo.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    pk: 'ADMIN',
                    sk: `ACTIVITY#${now}#${randomUUID()}`,
                    id: randomUUID(),
                    action: 'INVITATION_SENT',
                    targetId: id,
                    targetEmail: body.email,
                    adminName: profileRes.Item.name ?? null,
                    adminEmail: profileRes.Item.email ?? null,
                    createdAt: now,
                },
            }))
        } catch {}

        return toApiGatewayResponse(created({ id }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
