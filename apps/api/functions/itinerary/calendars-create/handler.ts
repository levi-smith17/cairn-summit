import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { randomUUID } from 'crypto'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getUserId } from '../../shared/auth'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const ssm = new SSMClient({ region: process.env.AWS_REGION })
        const body = JSON.parse(event.body ?? '{}')

        if (!body.name || !body.appleId || !body.password) {
            return toApiGatewayResponse(badRequest('name, appleId, and password are required'))
        }

        const pk = getPk(event)
        const userId = getUserId(event)
        const id = randomUUID()
        const sk = `ITINERARY#${id}`
        const now = new Date().toISOString()
        const ssmPasswordPath = `/cairn/users/${userId}/itinerary/${id}/password`

        await ssm.send(new PutParameterCommand({
            Name: ssmPasswordPath,
            Value: body.password,
            Type: 'SecureString',
            Overwrite: true,
        }))

        const item = {
            pk,
            sk,
            name: body.name,
            appleId: body.appleId,
            serverUrl: body.serverUrl ?? 'https://caldav.icloud.com',
            color: body.color ?? '#007AFF',
            syncEnabled: body.syncEnabled ?? true,
            ssmPasswordPath,
            createdAt: now,
        }

        await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))

        const { ssmPasswordPath: _omit, ...publicItem } = item
        return toApiGatewayResponse(created({ ...publicItem, id }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
