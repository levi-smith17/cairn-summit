import { QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getUserId } from '../../shared/auth'
import { toApiGatewayResponse, noContent, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION })
        const pk = getPk(event)
        const userId = getUserId(event)

        // Collect all items for this user across multiple pages
        const allItems: { pk: string; sk: string }[] = []
        let lastKey: Record<string, unknown> | undefined

        do {
            const result = await dynamo.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk',
                ExpressionAttributeValues: { ':pk': pk },
                ProjectionExpression: 'pk, sk',
                ExclusiveStartKey: lastKey,
            }))
            for (const item of result.Items ?? []) {
                allItems.push({ pk: item.pk, sk: item.sk })
            }
            lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
        } while (lastKey)

        // Batch delete all user items in chunks of 25 (DynamoDB limit)
        const chunks: { pk: string; sk: string }[][] = []
        for (let i = 0; i < allItems.length; i += 25) {
            chunks.push(allItems.slice(i, i + 25))
        }

        await Promise.all(chunks.map(chunk =>
            dynamo.send(new BatchWriteCommand({
                RequestItems: {
                    [TABLE_NAME]: chunk.map(item => ({
                        DeleteRequest: { Key: { pk: item.pk, sk: item.sk } }
                    }))
                }
            }))
        ))

        // Delete the Cognito user (sub == Cognito username in our user pool)
        await cognito.send(new AdminDeleteUserCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID!,
            Username: userId,
        }))

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
