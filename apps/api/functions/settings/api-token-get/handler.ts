import { GetCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
    try {
        const pk = getPk(event)
        const result = await dynamo.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: { pk, sk: 'API_TOKEN' },
            }),
        )

        if (!result.Item) {
            return toApiGatewayResponse(ok({ configured: false }))
        }

        return toApiGatewayResponse(
            ok({
                configured: true,
                tokenPrefix: result.Item.tokenPrefix,
                createdAt: result.Item.createdAt,
                lastUsedAt: result.Item.lastUsedAt ?? null,
            }),
        )
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
