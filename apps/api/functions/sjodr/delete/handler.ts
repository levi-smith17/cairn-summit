import { DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
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
            return toApiGatewayResponse(badRequest('Missing sjodr id'))
        }

        const pk = getPk(event)
        const fundId = id

        // Clear fundId from Audr entities that reference this fund
        const prefixes = ['BURN#', 'SUPPLYLINE#', 'CACHE#']
        await Promise.all(prefixes.map(async (prefix) => {
            const result = await dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': pk, ':prefix': prefix },
            }))
            await Promise.all(
                (result.Items ?? [])
                    .filter((item) => item.fundId === fundId)
                    .map((item) =>
                        dynamo.send(new UpdateCommand({
                            TableName: TABLE_NAME,
                            Key: { pk, sk: item.sk },
                            UpdateExpression: 'REMOVE fundId',
                        })),
                    ),
            )
        }))

        await dynamo.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `SJODR#${id}` },
        }))

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
