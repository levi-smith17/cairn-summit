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
            return toApiGatewayResponse(badRequest('Missing companion id'))
        }

        const body = JSON.parse(event.body ?? '{}')
        const pk = getPk(event)

        const setExprs: string[] = []
        const removeExprs: string[] = []
        const exprNames: Record<string, string> = {}
        const exprValues: Record<string, unknown> = {}

        const fields: Array<{ key: string; alias: string }> = [
            { key: 'name', alias: '#n' },
            { key: 'species', alias: '#species' },
            { key: 'breed', alias: '#breed' },
            { key: 'birthday', alias: '#birthday' },
            { key: 'bio', alias: '#bio' },
            { key: 'passed', alias: '#passed' },
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

        if ('media' in body) {
            if (!Array.isArray(body.media)) {
                return toApiGatewayResponse(badRequest('media must be an array'))
            }
            let media: Array<{
                id: string
                key: string
                type: 'IMAGE' | 'VIDEO'
                caption: string | null
                order: number
            }>
            try {
                media = body.media.map((item: unknown, index: number) => {
                    if (!item || typeof item !== 'object') {
                        throw new Error('Invalid media item')
                    }
                    const entry = item as Record<string, unknown>
                    if (typeof entry.id !== 'string' || typeof entry.key !== 'string') {
                        throw new Error('media items require id and key')
                    }
                    const type: 'IMAGE' | 'VIDEO' =
                        entry.type === 'VIDEO' ||
                        String(entry.type ?? '').toUpperCase() === 'VIDEO'
                            ? 'VIDEO'
                            : 'IMAGE'
                    return {
                        id: entry.id,
                        key: entry.key,
                        type,
                        caption:
                            entry.caption === undefined || entry.caption === null
                                ? null
                                : String(entry.caption),
                        order: typeof entry.order === 'number' ? entry.order : index,
                    }
                })
            } catch (error) {
                return toApiGatewayResponse(
                    badRequest(error instanceof Error ? error.message : 'Invalid media'),
                )
            }
            exprNames['#media'] = 'media'
            setExprs.push('#media = :media')
            exprValues[':media'] = media
        }

        const parts: string[] = []
        if (setExprs.length > 0) parts.push(`SET ${setExprs.join(', ')}`)
        if (removeExprs.length > 0) parts.push(`REMOVE ${removeExprs.join(', ')}`)

        if (parts.length === 0) {
            return toApiGatewayResponse(badRequest('No fields provided to update'))
        }

        const result = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `COMPANION#${id}` },
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
