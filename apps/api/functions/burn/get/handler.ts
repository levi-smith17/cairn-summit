import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Burn } from '@cairn/types'
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

        const page = Math.max(1, parseInt(params.page ?? '1', 10))
        const pageSize = Math.max(1, parseInt(params.pageSize ?? '20', 10))

        const pk = getPk(event)

        const result = await dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'BURN#',
            },
        }))

        const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
        let items = ((result.Items ?? []) as Burn[]).filter(e => e.date.startsWith(monthPrefix))

        if (params.search) {
            const term = params.search.toLowerCase()
            items = items.filter(e => e.name.toLowerCase().includes(term))
        }

        if (params.markerId) {
            items = items.filter(e => e.markers.some(m => m.id === params.markerId))
        }

        if (params.fundId) {
            if (params.fundId === 'unassigned') {
                items = items.filter(e => !e.fundId)
            } else {
                items = items.filter(e => e.fundId === params.fundId)
            }
        }

        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        const total = items.length
        const start = (page - 1) * pageSize
        const paged = items.slice(start, start + pageSize)

        const burn = paged.map(e => ({
            ...e,
            id: (e.sk as string).split('#').pop(),
        }))

        return toApiGatewayResponse(ok({ burn, total, page, pageSize }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
