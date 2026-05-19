import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
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
        const now = new Date().toISOString()

        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `USER#${id}`,
                sk: 'PROFILE',
                name: body.name ?? null,
                email: body.email,
                username: body.username ?? null,
                customDomain: body.customDomain ?? null,
                isAdmin: body.isAdmin ?? false,
                listed: body.listed ?? false,
                defaultTerminology: 'CAIRN',
                defaultTheme: 'SYSTEM',
                timeFormat: 'TWELVE',
                createdAt: now,
            },
        }))

        try {
            await dynamo.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    pk: 'ADMIN',
                    sk: `ACTIVITY#${now}#${randomUUID()}`,
                    id: randomUUID(),
                    action: 'WAYFARER_CREATED',
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
