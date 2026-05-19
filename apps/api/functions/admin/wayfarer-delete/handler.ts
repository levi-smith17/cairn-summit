import { DeleteCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getPathId } from '../../shared/auth'
import { toApiGatewayResponse, noContent, badRequest, forbidden, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const pk = getPk(event)
        const targetId = getPathId(event)
        if (!targetId) return toApiGatewayResponse(badRequest('id is required'))

        const profileRes = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: 'PROFILE' },
        }))
        if (!profileRes.Item?.isAdmin) return toApiGatewayResponse(forbidden('Admin access required'))

        const targetPk = `USER#${targetId}`
        let lastKey: Record<string, any> | undefined
        do {
            const res = await dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk',
                ExpressionAttributeValues: { ':pk': targetPk },
                ExclusiveStartKey: lastKey,
            }))
            for (const item of (res.Items ?? [])) {
                await dynamo.send(new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: { pk: item.pk, sk: item.sk },
                }))
            }
            lastKey = res.LastEvaluatedKey
        } while (lastKey)

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
