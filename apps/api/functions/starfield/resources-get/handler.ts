import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'

export const handler = async (
    _event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const result = await dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': 'SF#RESOURCE',
                ':prefix': 'RESOURCE#',
            },
        }))

        return toApiGatewayResponse(ok(result.Items ?? []))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
