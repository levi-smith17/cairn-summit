import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Cache } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { findCacheById } from '../../shared/cache'
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

        if (body.limit === undefined && !('fundId' in body)) {
            return toApiGatewayResponse(badRequest('limit or fundId is required'))
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

        const cache = findCacheById((result.Items ?? []) as (Cache & { id?: string })[], id)

        if (!cache) {
            return toApiGatewayResponse(notFound('Cache not found'))
        }

        const setExprs: string[] = []
        const removeExprs: string[] = []
        const exprNames: Record<string, string> = {}
        const exprValues: Record<string, unknown> = {}

        if (body.limit !== undefined) {
            setExprs.push('#limit = :limit')
            exprNames['#limit'] = 'limit'
            exprValues[':limit'] = body.limit
        }

        if ('fundId' in body) {
            if (body.fundId) {
                setExprs.push('fundId = :fundId')
                exprValues[':fundId'] = body.fundId
            } else {
                removeExprs.push('fundId')
            }
        }

        const parts: string[] = []
        if (setExprs.length > 0) parts.push(`SET ${setExprs.join(', ')}`)
        if (removeExprs.length > 0) parts.push(`REMOVE ${removeExprs.join(', ')}`)

        const updateResult = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: cache.sk },
            UpdateExpression: parts.join(' '),
            ...(Object.keys(exprNames).length > 0 ? { ExpressionAttributeNames: exprNames } : {}),
            ...(Object.keys(exprValues).length > 0 ? { ExpressionAttributeValues: exprValues } : {}),
            ReturnValues: 'ALL_NEW',
        }))

        return toApiGatewayResponse(ok(updateResult.Attributes as Cache))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
