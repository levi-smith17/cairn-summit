"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = require("crypto");
const auth_1 = require("../../shared/auth");
const s3_1 = require("../../shared/s3");
const db_1 = require("../../shared/db");
const response_1 = require("../../shared/response");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
]);
function extFromContentType(contentType) {
    const map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/heic': 'heic',
    };
    return map[contentType] ?? 'jpg';
}
const handler = async (event) => {
    try {
        const body = JSON.parse(event.body ?? '{}');
        const { contentType, fileSize, logId } = body;
        if (!contentType)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('contentType is required'));
        if (!logId)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('logId is required'));
        if (!ALLOWED_TYPES.has(contentType))
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Unsupported file type'));
        if (fileSize && fileSize > MAX_FILE_SIZE)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('File too large (max 10 MB)'));
        const userId = (0, auth_1.getUserId)(event);
        const pk = (0, auth_1.getPk)(event);
        const filename = `${(0, crypto_1.randomUUID)()}.${extFromContentType(contentType)}`;
        const key = `logs/${userId}/${filename}`;
        // Register the key on the log record first so S3 objects are
        // always tracked — an unuploaded key is harmless, an untracked
        // S3 object is an orphan that can never be cleaned up
        await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `LOG#${logId}` },
            UpdateExpression: 'SET mediaKeys = list_append(if_not_exists(mediaKeys, :empty), :newKey), updatedAt = :now',
            ExpressionAttributeValues: {
                ':newKey': [key],
                ':empty': [],
                ':now': new Date().toISOString(),
            },
        }));
        const url = await (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3, new client_s3_1.PutObjectCommand({
            Bucket: s3_1.PUBLIC_MEDIA_BUCKET,
            Key: key,
            ContentType: contentType,
        }), { expiresIn: s3_1.PRESIGN_EXPIRES });
        const cloudFrontUrl = `${process.env.CLOUDFRONT_PUBLIC_MEDIA_URL}/${key}`;
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ url, key, cloudFrontUrl }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map