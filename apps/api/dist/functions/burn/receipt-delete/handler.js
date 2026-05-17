"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_s3_1 = require("@aws-sdk/client-s3");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const s3_1 = require("../../shared/s3");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const key = event.queryStringParameters?.key;
        if (!key)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('key is required'));
        const userId = (0, auth_1.getUserId)(event);
        if (!key.startsWith(`receipts/${userId}/`)) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.forbidden)('Access denied'));
        }
        const pk = (0, auth_1.getPk)(event);
        // Find the expense that owns this receipt
        const result = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            FilterExpression: 'receiptUrl = :key',
            ExpressionAttributeValues: { ':pk': pk, ':prefix': 'BURN#', ':key': key },
            ProjectionExpression: 'sk',
        }));
        const expense = result.Items?.[0];
        if (!expense)
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Receipt not found'));
        // Delete from S3 and clear from DynamoDB in parallel
        await Promise.all([
            s3_1.s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: s3_1.PRIVATE_MEDIA_BUCKET, Key: key })),
            db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
                TableName: db_1.TABLE_NAME,
                Key: { pk, sk: expense.sk },
                UpdateExpression: 'REMOVE receiptUrl',
            })),
        ]);
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ deleted: true }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map