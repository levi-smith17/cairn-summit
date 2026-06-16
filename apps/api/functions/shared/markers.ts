import { BatchGetCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME } from './db'

export interface ResolvedMarker {
    id: string
    name: string
    color: string
    icon?: string
}

export async function resolveMarkersById(
    pk: string,
    markerIds: string[],
): Promise<Map<string, ResolvedMarker>> {
    const unique = [...new Set(markerIds.filter(Boolean))]
    if (!unique.length) return new Map()

    const result = await dynamo.send(new BatchGetCommand({
        RequestItems: {
            [TABLE_NAME]: {
                Keys: unique.map(id => ({ pk, sk: `MARKER#${id}` })),
            },
        },
    }))

    const map = new Map<string, ResolvedMarker>()
    for (const item of result.Responses?.[TABLE_NAME] ?? []) {
        const id = (item.sk as string).split('#').pop()!
        map.set(id, {
            id,
            name: item.name as string,
            color: item.color as string,
            ...(item.icon ? { icon: item.icon as string } : {}),
        })
    }
    return map
}
