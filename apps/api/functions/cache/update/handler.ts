import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Cache } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, notFound, serverError } from '../../shared/response'

function resolveCacheSk(
    id: string,
    body: { markerId?: string; month?: number; year?: number },
): string | null {
    if (body.markerId != null && body.month != null && body.year != null) {
        return `CACHE#${body.markerId}#${body.month}#${body.year}`
    }
    // Legacy composite ids are the sk without the CACHE# prefix (markerId#month#year).
    if (id.includes('#')) {
        return id.startsWith('CACHE#') ? id : `CACHE#${id}`
    }
    return null
}

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
        const sk = resolveCacheSk(id, body)

        if (!sk) {
            // UUID-only updates need marker/month/year so we can target the deterministic key
            // without a DynamoDB Query (write roles historically lack Query).
            return toApiGatewayResponse(
                badRequest('markerId, month, and year are required to update cache'),
            )
        }

        const existing = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk },
        }))

        if (!existing.Item) {
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

        if (setExprs.length === 0 && removeExprs.length === 0) {
            return toApiGatewayResponse(ok(existing.Item as Cache))
        }

        const parts: string[] = []
        if (setExprs.length > 0) parts.push(`SET ${setExprs.join(', ')}`)
        if (removeExprs.length > 0) parts.push(`REMOVE ${removeExprs.join(', ')}`)

        const updateResult = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk },
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
