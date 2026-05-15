import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Cache } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const params = event.queryStringParameters ?? {}

        if (!params.month || !params.year) {
            return toApiGatewayResponse(badRequest('month and year are required'))
        }

        const month = parseInt(params.month, 10)
        const year = parseInt(params.year, 10)

        if (isNaN(month) || isNaN(year)) {
            return toApiGatewayResponse(badRequest('month and year must be numbers'))
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

        const cache = ((result.Items ?? []) as (Cache & { id: string })[])
            .filter(b => {
                const parts = (b.sk as string).split('#')
                return parts[2] === String(month) && parts[3] === String(year)
            })

        return toApiGatewayResponse(ok(cache))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
