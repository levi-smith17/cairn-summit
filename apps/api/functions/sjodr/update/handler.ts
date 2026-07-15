import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Sjodr } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = getPathId(event)

        if (!id) {
            return toApiGatewayResponse(badRequest('Missing sjodr id'))
        }

        const body = JSON.parse(event.body ?? '{}')

        if (!body.name?.trim()) {
            return toApiGatewayResponse(badRequest('name is required'))
        }

        const pk = getPk(event)
        const setExprs = ['#name = :name']
        const removeExprs: string[] = []
        const exprNames: Record<string, string> = { '#name': 'name' }
        const exprValues: Record<string, unknown> = { ':name': body.name.trim() }

        if ('description' in body) {
            if (body.description?.trim()) {
                setExprs.push('description = :description')
                exprValues[':description'] = body.description.trim()
            } else {
                removeExprs.push('description')
            }
        }

        const parts = [`SET ${setExprs.join(', ')}`]
        if (removeExprs.length > 0) parts.push(`REMOVE ${removeExprs.join(', ')}`)

        const result = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `SJODR#${id}` },
            UpdateExpression: parts.join(' '),
            ExpressionAttributeNames: exprNames,
            ExpressionAttributeValues: exprValues,
            ReturnValues: 'ALL_NEW',
        }))

        return toApiGatewayResponse(ok(result.Attributes as Sjodr))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
