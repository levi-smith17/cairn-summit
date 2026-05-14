import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = event.pathParameters?.id

        if (!id) {
            return toApiGatewayResponse(badRequest('Missing network id'))
        }

        const body = JSON.parse(event.body ?? '{}')

        if (!body.name) {
            return toApiGatewayResponse(badRequest('name is required'))
        }

        const pk = getPk(event)

        const result = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `SF#NETWORK#${id}` },
            UpdateExpression: 'SET #name = :name',
            ExpressionAttributeNames: { '#name': 'name' },
            ExpressionAttributeValues: { ':name': body.name },
            ReturnValues: 'ALL_NEW',
        }))

        return toApiGatewayResponse(ok(result.Attributes))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
