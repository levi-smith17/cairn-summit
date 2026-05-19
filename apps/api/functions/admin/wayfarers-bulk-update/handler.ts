import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, noContent, badRequest, forbidden, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const pk = getPk(event)

        const profileRes = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: 'PROFILE' },
        }))
        if (!profileRes.Item?.isAdmin) return toApiGatewayResponse(forbidden('Admin access required'))

        const body = JSON.parse(event.body ?? '{}')
        if (!Array.isArray(body.ids)) return toApiGatewayResponse(badRequest('ids is required'))

        await Promise.all(
            body.ids.map((id: string) =>
                dynamo.send(new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: { pk: `USER#${id}`, sk: 'PROFILE' },
                    UpdateExpression: 'SET listed = :listed',
                    ExpressionAttributeValues: { ':listed': body.listed ?? false },
                }))
            )
        )

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
