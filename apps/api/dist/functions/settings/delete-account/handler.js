"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const cognito = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
        const pk = (0, auth_1.getPk)(event);
        const userId = (0, auth_1.getUserId)(event);
        // Collect all items for this user across multiple pages
        const allItems = [];
        let lastKey;
        do {
            const result = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk',
                ExpressionAttributeValues: { ':pk': pk },
                ProjectionExpression: 'pk, sk',
                ExclusiveStartKey: lastKey,
            }));
            for (const item of result.Items ?? []) {
                allItems.push({ pk: item.pk, sk: item.sk });
            }
            lastKey = result.LastEvaluatedKey;
        } while (lastKey);
        // Batch delete all user items in chunks of 25 (DynamoDB limit)
        const chunks = [];
        for (let i = 0; i < allItems.length; i += 25) {
            chunks.push(allItems.slice(i, i + 25));
        }
        await Promise.all(chunks.map(chunk => db_1.dynamo.send(new lib_dynamodb_1.BatchWriteCommand({
            RequestItems: {
                [db_1.TABLE_NAME]: chunk.map(item => ({
                    DeleteRequest: { Key: { pk: item.pk, sk: item.sk } }
                }))
            }
        }))));
        // Delete the Cognito user (sub == Cognito username in our user pool)
        await cognito.send(new client_cognito_identity_provider_1.AdminDeleteUserCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: userId,
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.noContent)());
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map