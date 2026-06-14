import {
    GetCommand,
    PutCommand,
    QueryCommand,
    ScanCommand,
} from '@aws-sdk/lib-dynamodb'

type Item = Record<string, unknown>

function itemKey(pk: string, sk: string): string {
    return `${pk}\0${sk}`
}

export function createMemoryDynamo() {
    const store = new Map<string, Item>()

    return {
        send: async (command: unknown) => {
            if (command instanceof GetCommand) {
                const { pk, sk } = command.input.Key as { pk: string; sk: string }
                const item = store.get(itemKey(pk, sk))
                return { Item: item ? { ...item } : undefined }
            }

            if (command instanceof PutCommand) {
                const item = command.input.Item as Item
                store.set(
                    itemKey(item.pk as string, item.sk as string),
                    { ...item },
                )
                return {}
            }

            if (command instanceof QueryCommand) {
                const pk = command.input.ExpressionAttributeValues?.[':pk'] as string
                const prefix = command.input.ExpressionAttributeValues?.[':prefix'] as
                    | string
                    | undefined
                const items = [...store.values()].filter(i => {
                    if (i.pk !== pk) return false
                    if (prefix && !String(i.sk).startsWith(prefix)) return false
                    return true
                })
                return { Items: items.map(i => ({ ...i })) }
            }

            if (command instanceof ScanCommand) {
                const values = command.input.ExpressionAttributeValues ?? {}
                const filter = command.input.FilterExpression ?? ''
                const items = [...store.values()].filter(i => {
                    if (filter.includes('sk = :sk') && i.sk !== values[':sk']) {
                        return false
                    }
                    if (
                        filter.includes('username = :username')
                        && i.username !== values[':username']
                    ) {
                        return false
                    }
                    return true
                })
                return { Items: items.map(i => ({ ...i })) }
            }

            throw new Error(`Unsupported DynamoDB command: ${(command as object).constructor?.name}`)
        },
        reset: () => store.clear(),
        seed: (items: Item[]) => {
            for (const item of items) {
                store.set(
                    itemKey(item.pk as string, item.sk as string),
                    { ...item },
                )
            }
        },
    }
}

let sharedMemory: ReturnType<typeof createMemoryDynamo> | null = null

export function getSharedMemoryDynamo() {
    if (!sharedMemory) sharedMemory = createMemoryDynamo()
    return sharedMemory
}
