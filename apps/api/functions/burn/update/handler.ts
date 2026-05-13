import { BatchGetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Burn, EmbeddedMarker } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

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
        const id = getPathId(event)

        if (!id) {
            return toApiGatewayResponse(badRequest('Missing expense id'))
        }

        const body = JSON.parse(event.body ?? '{}')
        const pk = getPk(event)
        const sk = `BURN#${id}`

        const setExprs: string[] = []
        const removeExprs: string[] = []
        const exprNames: Record<string, string> = {}
        const exprValues: Record<string, unknown> = {}

        if ('name' in body) {
            setExprs.push('#name = :name')
            exprNames['#name'] = 'name'
            exprValues[':name'] = body.name
        }

        if ('amount' in body) {
            setExprs.push('amount = :amount')
            exprValues[':amount'] = body.amount
        }

        if ('date' in body) {
            setExprs.push('#date = :date')
            exprNames['#date'] = 'date'
            exprValues[':date'] = body.date
        }

        if ('notes' in body) {
            if (body.notes) {
                setExprs.push('notes = :notes')
                exprValues[':notes'] = body.notes
            } else {
                removeExprs.push('notes')
            }
        }

        if ('receiptUrl' in body) {
            if (body.receiptUrl) {
                setExprs.push('receiptUrl = :receiptUrl')
                exprValues[':receiptUrl'] = body.receiptUrl
            } else {
                removeExprs.push('receiptUrl')
            }
        }

        if ('markerIds' in body) {
            const markers = await resolveMarkers(pk, Array.isArray(body.markerIds) ? body.markerIds : [])
            setExprs.push('markers = :markers')
            exprValues[':markers'] = markers
        }

        if (setExprs.length === 0 && removeExprs.length === 0) {
            return toApiGatewayResponse(badRequest('No valid fields to update'))
        }

        const parts: string[] = []
        if (setExprs.length > 0) parts.push(`SET ${setExprs.join(', ')}`)
        if (removeExprs.length > 0) parts.push(`REMOVE ${removeExprs.join(', ')}`)
        const UpdateExpression = parts.join(' ')

        const result = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk },
            UpdateExpression,
            ...(Object.keys(exprNames).length > 0 ? { ExpressionAttributeNames: exprNames } : {}),
            ExpressionAttributeValues: exprValues,
            ReturnValues: 'ALL_NEW',
        }))

        return toApiGatewayResponse(ok(result.Attributes as Burn))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
