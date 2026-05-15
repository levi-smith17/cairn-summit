import { QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getUserId } from '../../shared/auth'
import { toApiGatewayResponse, noContent, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = event.pathParameters?.id

        if (!id) {
            return toApiGatewayResponse(badRequest('Missing network id'))
        }

        const pk = getPk(event)

        // Step 1: Query all outposts belonging to this network
        const outpostsResult = await dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            FilterExpression: 'networkId = :nid',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'SF#FACILITY#',
                ':nid': id,
            },
        }))

        // Step 2: Delete each matching outpost
        await Promise.all(
            (outpostsResult.Items ?? []).map(outpost =>
                dynamo.send(new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: { pk, sk: outpost.sk },
                }))
            )
        )

        // Step 3: Delete the network itself
        await dynamo.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `SF#NETWORK#${id}` },
        }))

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
