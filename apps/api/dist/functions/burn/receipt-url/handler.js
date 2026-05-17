"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
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
        // Verify the key is scoped to this user before any DB query
        if (!key.startsWith(`receipts/${userId}/`)) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.forbidden)('Access denied'));
        }
        const pk = (0, auth_1.getPk)(event);
        // Verify the receipt is attached to one of this user's expenses
        const result = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            FilterExpression: 'receiptUrl = :key',
            ExpressionAttributeValues: { ':pk': pk, ':prefix': 'BURN#', ':key': key },
            ProjectionExpression: 'sk',
        }));
        if (!result.Items?.length) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Receipt not found'));
        }
        const presignedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3, new client_s3_1.GetObjectCommand({ Bucket: s3_1.PRIVATE_MEDIA_BUCKET, Key: key }), { expiresIn: s3_1.PRESIGN_EXPIRES });
        return {
            statusCode: 302,
            headers: {
                'Location': presignedUrl,
                'Cache-Control': 'private, max-age=3600',
                'Access-Control-Allow-Origin': process.env.WEB_URL ?? '*',
            },
            body: '',
        };
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map