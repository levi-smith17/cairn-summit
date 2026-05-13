import { BatchGetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Burn, EmbeddedMarker } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

async function resolveMarkers(pk: string, markerIds: string[]): Promise<EmbeddedMarker[]> {
    if (!markerIds.length) return []

    const result = await dynamo.send(new BatchGetCommand({
        RequestItems: {
            [TABLE_NAME]: {
                Keys: markerIds.map(mid => ({ pk, sk: `MARKER#${mid}` })),
            },
        },
    }))

    return (result.Responses?.[TABLE_NAME] ?? []).map((m: any) => ({
        id: m.sk.split('#').pop() as string,
        name: m.name as string,
        color: m.color as string,
        ...(m.icon ? { icon: m.icon as string } : {}),
    }))
}

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')

        if (!body.name || body.amount === undefined || !body.date) {
            return toApiGatewayResponse(badRequest('name, amount, and date are required'))
        }

        const pk = getPk(event)
        const id = randomUUID()
        const sk = `BURN#${id}`

        const markers = await resolveMarkers(pk, Array.isArray(body.markerIds) ? body.markerIds : [])

        const burn: Burn & { id: string } = {
            pk,
            sk,
            id,
            name: body.name,
            amount: body.amount,
            date: body.date,
            ...(body.notes ? { notes: body.notes } : {}),
            ...(body.receiptUrl ? { receiptUrl: body.receiptUrl } : {}),
            markers,
            createdAt: new Date().toISOString(),
        }

        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: expense,
        }))

        return toApiGatewayResponse(created(expense))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
