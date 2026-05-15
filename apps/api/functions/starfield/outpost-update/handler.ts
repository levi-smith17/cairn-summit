import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

const ALLOWED_FIELDS = ['system', 'planet', 'parentId', 'transferStationLimit'] as const

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = event.pathParameters?.id

        if (!id) {
            return toApiGatewayResponse(badRequest('Missing outpost id'))
        }

        const body = JSON.parse(event.body ?? '{}')

        const setParts: string[] = []
        const expressionAttributeNames: Record<string, string> = {}
        const expressionAttributeValues: Record<string, unknown> = {}

        for (const field of ALLOWED_FIELDS) {
            if (body[field] !== undefined) {
                const alias = `#${field}`
                const placeholder = `:${field}`
                setParts.push(`${alias} = ${placeholder}`)
                expressionAttributeNames[alias] = field
                expressionAttributeValues[placeholder] = body[field]
            }
        }

        if (setParts.length === 0) {
            return toApiGatewayResponse(badRequest('No updatable fields provided'))
        }

        const pk = getPk(event)

        const result = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `SF#FACILITY#${id}` },
            UpdateExpression: `SET ${setParts.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        }))

        const attrs = result.Attributes ?? {}

        return toApiGatewayResponse(ok({
            ...attrs,
            resources: Object.values(attrs.resources ?? {}),
        }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
