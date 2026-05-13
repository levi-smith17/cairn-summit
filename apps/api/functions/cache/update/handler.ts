import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Cache } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = getPathId(event)

        if (!id) {
            return toApiGatewayResponse(badRequest('Missing cache id'))
        }

        const body = JSON.parse(event.body ?? '{}')

        if (body.limit === undefined) {
            return toApiGatewayResponse(badRequest('limit is required'))
        }

        const pk = getPk(event)

        const result = await dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'CACHE#',
            },
        }))

        const cache = (result.Items ?? []).find((b: any) => b.id === id) as (Cache & { id: string }) | undefined

        if (!cache) {
            return toApiGatewayResponse(notFound('Cache not found'))
        }

        const updateResult = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: cache.sk },
            UpdateExpression: 'SET #limit = :limit',
            ExpressionAttributeNames: { '#limit': 'limit' },
            ExpressionAttributeValues: { ':limit': body.limit },
            ReturnValues: 'ALL_NEW',
        }))

        return toApiGatewayResponse(ok(updateResult.Attributes as Cache))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
