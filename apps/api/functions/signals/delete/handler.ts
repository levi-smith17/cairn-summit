import { BatchWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { toApiGatewayResponse, noContent, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = getPathId(event)
        if (!id) return toApiGatewayResponse(badRequest('Missing signal id'))

        const pk = getPk(event)

        // Query the signal + all its replies (all share the SIGNAL#<id> prefix)
        const result = await dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': `SIGNAL#${id}`,
            },
        }))

        const items = result.Items ?? []
        if (items.length === 0) return toApiGatewayResponse(noContent())

        // BatchWrite supports 25 items per call
        const chunks: any[][] = []
        for (let i = 0; i < items.length; i += 25) {
            chunks.push(items.slice(i, i + 25))
        }

        await Promise.all(chunks.map(chunk =>
            dynamo.send(new BatchWriteCommand({
                RequestItems: {
                    [TABLE_NAME]: chunk.map(item => ({
                        DeleteRequest: { Key: { pk, sk: item.sk } },
                    })),
                },
            }))
        ))

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
