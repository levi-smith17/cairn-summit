import { QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Cache } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')

        if (body.month === undefined || body.year === undefined) {
            return toApiGatewayResponse(badRequest('month and year are required'))
        }

        const month: number = body.month
        const year: number = body.year

        const prevMonth = month === 1 ? 12 : month - 1
        const prevYear = month === 1 ? year - 1 : year

        const pk = getPk(event)

        const [prevResult, currentResult] = await Promise.all([
            dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': pk, ':prefix': 'CACHE#' },
            })),
            dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': pk, ':prefix': 'CACHE#' },
            })),
        ])

        const prevBudgets = ((prevResult.Items ?? []) as (Cache & { id: string })[])
            .filter(b => {
                const parts = (b.sk as string).split('#')
                return parts[2] === String(prevMonth) && parts[3] === String(prevYear)
            })

        const existingMarkerIds = new Set(
            ((currentResult.Items ?? []) as (Cache & { id: string })[])
                .filter(b => {
                    const parts = (b.sk as string).split('#')
                    return parts[2] === String(month) && parts[3] === String(year)
                })
                .map(b => b.markerId)
        )

        const toCreate = prevBudgets.filter(b => !existingMarkerIds.has(b.markerId))

        if (toCreate.length === 0) {
            return toApiGatewayResponse(ok({ count: 0 }))
        }

        const newItems = toCreate.map(b => ({
            pk,
            sk: `CACHE#${b.markerId}#${month}#${year}`,
            id: randomUUID(),
            markerId: b.markerId,
            markerName: b.markerName,
            limit: b.limit,
            month,
            year,
        }))

        const chunks: typeof newItems[] = []
        for (let i = 0; i < newItems.length; i += 25) {
            chunks.push(newItems.slice(i, i + 25))
        }

        await Promise.all(
            chunks.map(chunk =>
                dynamo.send(new BatchWriteCommand({
                    RequestItems: {
                        [TABLE_NAME]: chunk.map(item => ({
                            PutRequest: { Item: item },
                        })),
                    },
                }))
            )
        )

        return toApiGatewayResponse(ok({ count: newItems.length }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
