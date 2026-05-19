import { DeleteCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, noContent, badRequest, forbidden, serverError } from '../../shared/response'

async function deleteAllUserItems(targetPk: string): Promise<void> {
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
}

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

        for (const id of body.ids) {
            await deleteAllUserItems(`USER#${id}`)
        }

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
