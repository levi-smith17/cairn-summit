import { DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, noContent, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
    try {
        const pk = getPk(event)
        const existing = await dynamo.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: { pk, sk: 'API_TOKEN' },
            }),
        )

        const tokenHash = existing.Item?.tokenHash
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

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
