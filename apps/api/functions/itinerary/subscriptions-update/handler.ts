import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getPathId } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, notFound, serverError } from '../../shared/response'

const UPDATABLE_FIELDS = ['name', 'url', 'color', 'syncEnabled'] as const

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = getPathId(event)
        if (!id) return toApiGatewayResponse(badRequest('Missing subscription id'))

        const body = JSON.parse(event.body ?? '{}')
        const pk = getPk(event)

        const setExprs: string[] = []
        const exprNames: Record<string, string> = {}
        const exprValues: Record<string, unknown> = {}

        for (const field of UPDATABLE_FIELDS) {
            if (field in body) {
                setExprs.push(`#${field} = :${field}`)
                exprNames[`#${field}`] = field
                exprValues[`:${field}`] = body[field]
            }
        }

        if (setExprs.length === 0) return toApiGatewayResponse(badRequest('No valid fields to update'))

        const result = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `ITINERARY_SUB#${id}` },
            UpdateExpression: `SET ${setExprs.join(', ')}`,
            ExpressionAttributeNames: exprNames,
            ExpressionAttributeValues: exprValues,
            ConditionExpression: 'attribute_exists(pk)',
            ReturnValues: 'ALL_NEW',
        }))

        return toApiGatewayResponse(ok({ ...result.Attributes, id }))
    } catch (err: any) {
        if (err.name === 'ConditionalCheckFailedException') {
            return toApiGatewayResponse(notFound('Calendar subscription not found'))
        }
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
