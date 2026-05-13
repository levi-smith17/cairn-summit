import { BatchGetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Supplyline, EmbeddedMarker } from '@cairn/types'
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

        if (!body.name || body.amount === undefined || !body.billingCycle || !body.nextRenewal) {
            return toApiGatewayResponse(badRequest('name, amount, billingCycle, and nextRenewal are required'))
        }

        const pk = getPk(event)
        const id = randomUUID()
        const sk = `SUPPLYLINE#${id}`

        const markers = await resolveMarkers(pk, Array.isArray(body.markerIds) ? body.markerIds : [])

        const supplyline: Supplyline & { id: string } = {
            pk,
            sk,
            id,
            name: body.name,
            amount: body.amount,
            billingCycle: body.billingCycle,
            nextRenewal: body.nextRenewal,
            ...(body.url ? { url: body.url } : {}),
            ...(body.notes ? { notes: body.notes } : {}),
            active: body.active ?? true,
            markers,
            createdAt: new Date().toISOString(),
        }

        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: provision,
        }))

        return toApiGatewayResponse(created(provision))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
