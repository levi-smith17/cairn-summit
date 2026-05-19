import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getPathId } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, forbidden, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const pk = getPk(event)
        const targetId = getPathId(event)
        if (!targetId) return toApiGatewayResponse(badRequest('id is required'))

        const profileRes = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: 'PROFILE' },
        }))
        if (!profileRes.Item?.isAdmin) return toApiGatewayResponse(forbidden('Admin access required'))

        const body = JSON.parse(event.body ?? '{}')
        if (!body.email) return toApiGatewayResponse(badRequest('email is required'))

        const now = new Date().toISOString()

        await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: `USER#${targetId}`, sk: 'PROFILE' },
            UpdateExpression: 'SET #name = :name, email = :email, username = :username, customDomain = :customDomain, isAdmin = :isAdmin, listed = :listed',
            ExpressionAttributeNames: { '#name': 'name' },
            ExpressionAttributeValues: {
                ':name': body.name ?? null,
                ':email': body.email,
                ':username': body.username ?? null,
                ':customDomain': body.customDomain ?? null,
                ':isAdmin': body.isAdmin ?? false,
                ':listed': body.listed ?? false,
            },
        }))

        try {
            await dynamo.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    pk: 'ADMIN',
                    sk: `ACTIVITY#${now}#${randomUUID()}`,
                    id: randomUUID(),
                    action: 'WAYFARER_UPDATED',
                    targetId,
                    targetEmail: body.email,
                    adminName: profileRes.Item.name ?? null,
                    adminEmail: profileRes.Item.email ?? null,
                    createdAt: now,
                },
            }))
        } catch {}

        return toApiGatewayResponse(ok({ id: targetId }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
