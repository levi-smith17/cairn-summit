import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Supplyline } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const pk = getPk(event)
        const params = event.queryStringParameters ?? {}

        const result = await dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'SUPPLYLINE#',
            },
        }))

        let items = (result.Items ?? []) as (Supplyline & { id?: string })[]

        if (params.search) {
            const term = params.search.toLowerCase()
            items = items.filter(p => p.name.toLowerCase().includes(term))
        }

        if (params.markerId) {
            items = items.filter(p => p.markers.some(m => m.id === params.markerId))
        }

        if (params.active !== undefined) {
            const activeFilter = params.active === 'true'
            items = items.filter(p => p.active === activeFilter)
        }

        const supplylines = items.map(p => ({
            ...p,
            id: (p.sk as string).split('#').pop(),
        }))

        return toApiGatewayResponse(ok(supplylines))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
