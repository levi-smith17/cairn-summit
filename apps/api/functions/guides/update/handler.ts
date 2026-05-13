import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = getPathId(event)

        if (!id) {
            return toApiGatewayResponse(badRequest('Missing guide id'))
        }

        const body = JSON.parse(event.body ?? '{}')
        const pk = getPk(event)

        const setExpressions: string[] = []
        const removeExpressions: string[] = []
        const expressionAttributeNames: Record<string, string> = {}
        const expressionAttributeValues: Record<string, unknown> = {}

        if (body.name !== undefined) {
            setExpressions.push('#name = :name')
            expressionAttributeNames['#name'] = 'name'
            expressionAttributeValues[':name'] = body.name
        }

        if (body.description === null) {
            removeExpressions.push('description')
        } else if (body.description !== undefined) {
            setExpressions.push('description = :description')
            expressionAttributeValues[':description'] = body.description
        }

        if (body.trailId === null) {
            removeExpressions.push('trailId')
        } else if (body.trailId !== undefined) {
            setExpressions.push('trailId = :trailId')
            expressionAttributeValues[':trailId'] = body.trailId
        }

        const parts: string[] = []
        if (setExpressions.length > 0) parts.push(`SET ${setExpressions.join(', ')}`)
        if (removeExpressions.length > 0) parts.push(`REMOVE ${removeExpressions.join(', ')}`)

        if (parts.length === 0) {
            return toApiGatewayResponse(badRequest('No fields to update'))
        }

        const result = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `GUIDE#${id}` },
            UpdateExpression: parts.join(' '),
            ...(Object.keys(expressionAttributeNames).length > 0 && { ExpressionAttributeNames: expressionAttributeNames }),
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        }))

        return toApiGatewayResponse(ok(result.Attributes))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
