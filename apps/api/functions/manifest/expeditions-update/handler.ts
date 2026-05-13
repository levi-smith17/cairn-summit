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
            return toApiGatewayResponse(badRequest('Missing expedition id'))
        }

        const body = JSON.parse(event.body ?? '{}')
        const pk = getPk(event)

        const setExprs: string[] = []
        const removeExprs: string[] = []
        const exprNames: Record<string, string> = {}
        const exprValues: Record<string, unknown> = {}

        const fields: Array<{ key: string; alias: string }> = [
            { key: 'title', alias: '#title' },
            { key: 'company', alias: '#company' },
            { key: 'location', alias: '#loc' },
            { key: 'startDate', alias: '#startDate' },
            { key: 'endDate', alias: '#endDate' },
            { key: 'current', alias: '#current' },
            { key: 'description', alias: '#desc' },
        ]

        for (const field of fields) {
            if (field.key in body) {
                exprNames[field.alias] = field.key
                if (body[field.key] !== null && body[field.key] !== undefined) {
                    setExprs.push(`${field.alias} = :${field.key}`)
                    exprValues[`:${field.key}`] = body[field.key]
                } else {
                    removeExprs.push(field.alias)
                }
            }
        }

        const parts: string[] = []
        if (setExprs.length > 0) parts.push(`SET ${setExprs.join(', ')}`)
        if (removeExprs.length > 0) parts.push(`REMOVE ${removeExprs.join(', ')}`)

        if (parts.length === 0) {
            return toApiGatewayResponse(badRequest('No fields provided to update'))
        }

        const result = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `EXPEDITION#${id}` },
            UpdateExpression: parts.join(' '),
            ExpressionAttributeNames: exprNames,
            ...(Object.keys(exprValues).length > 0 ? { ExpressionAttributeValues: exprValues } : {}),
            ReturnValues: 'ALL_NEW',
        }))

        return toApiGatewayResponse(ok(result.Attributes))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
