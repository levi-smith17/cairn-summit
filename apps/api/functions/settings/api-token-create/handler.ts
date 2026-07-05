import { DeleteCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getUserId } from '../../shared/auth'
import {
    generateApiToken,
    hashApiToken,
    tokenPrefixFromToken,
} from '../../shared/api-token'
import { toApiGatewayResponse, created, serverError } from '../../shared/response'

async function deleteExistingToken(pk: string, tokenHash?: string) {
    if (typeof tokenHash === 'string') {
        await dynamo.send(
            new DeleteCommand({
                TableName: TABLE_NAME,
                Key: {
                    pk: `TOKEN#${tokenHash}`,
                    sk: 'META',
                },
            }),
        )
    }

    await dynamo.send(
        new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: 'API_TOKEN' },
        }),
    )
}

export const handler = async (
    event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
    try {
        const userId = getUserId(event)
        const pk = getPk(event)
        const existing = await dynamo.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: { pk, sk: 'API_TOKEN' },
            }),
        )

        if (existing.Item?.tokenHash) {
            await deleteExistingToken(pk, existing.Item.tokenHash as string)
        }

        const token = generateApiToken()
        const tokenHash = hashApiToken(token)
        const createdAt = new Date().toISOString()

        await dynamo.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    pk,
                    sk: 'API_TOKEN',
                    tokenHash,
                    tokenPrefix: tokenPrefixFromToken(token),
                    createdAt,
                },
            }),
        )

        await dynamo.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    pk: `TOKEN#${tokenHash}`,
                    sk: 'META',
                    userId,
                    tokenPrefix: tokenPrefixFromToken(token),
                    createdAt,
                },
            }),
        )

        return toApiGatewayResponse(
            created({
                token,
                tokenPrefix: tokenPrefixFromToken(token),
                createdAt,
            }),
        )
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
