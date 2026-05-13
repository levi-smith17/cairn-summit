import { UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getPathId } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, notFound, serverError } from '../../shared/response'

const UPDATABLE_FIELDS = ['name', 'appleId', 'serverUrl', 'color', 'syncEnabled'] as const

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const ssm = new SSMClient({ region: process.env.AWS_REGION })
        const id = getPathId(event)
        if (!id) return toApiGatewayResponse(badRequest('Missing itinerary id'))

        const body = JSON.parse(event.body ?? '{}')
        const pk = getPk(event)
        const sk = `ITINERARY#${id}`

        // Fetch existing item to get the SSM path (needed if updating password)
        if (body.password) {
            const existing = await dynamo.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk } }))
            if (!existing.Item) return toApiGatewayResponse(notFound('Itinerary calendar not found'))

            await ssm.send(new PutParameterCommand({
                Name: existing.Item.ssmPasswordPath,
                Value: body.password,
                Type: 'SecureString',
                Overwrite: true,
            }))
        }

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
            Key: { pk, sk },
            UpdateExpression: `SET ${setExprs.join(', ')}`,
            ExpressionAttributeNames: exprNames,
            ExpressionAttributeValues: exprValues,
            ConditionExpression: 'attribute_exists(pk)',
            ReturnValues: 'ALL_NEW',
        }))

        const { ssmPasswordPath: _omit, ...publicItem } = result.Attributes ?? {}
        return toApiGatewayResponse(ok({ ...publicItem, id }))
    } catch (err: any) {
        if (err.name === 'ConditionalCheckFailedException') {
            return toApiGatewayResponse(notFound('Itinerary calendar not found'))
        }
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
