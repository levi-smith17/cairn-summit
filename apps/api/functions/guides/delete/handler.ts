import { QueryCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { toApiGatewayResponse, noContent, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = getPathId(event)

        if (!id) {
            return toApiGatewayResponse(badRequest('Missing guide id'))
        }

        const pk = getPk(event)

        const stonesResult = await dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': `STONE#${id}#`,
            },
        }))

        const stones = stonesResult.Items ?? []

        for (let i = 0; i < stones.length; i += 25) {
            const chunk = stones.slice(i, i + 25)
            await dynamo.send(new BatchWriteCommand({
                RequestItems: {
                    [TABLE_NAME]: chunk.map(stone => ({
                        DeleteRequest: {
                            Key: { pk: stone.pk, sk: stone.sk },
                        },
                    })),
                },
            }))
        }

        await dynamo.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `GUIDE#${id}` },
        }))

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
