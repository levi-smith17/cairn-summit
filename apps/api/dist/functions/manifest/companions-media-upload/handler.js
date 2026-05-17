"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = require("crypto");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const s3_1 = require("../../shared/s3");
const response_1 = require("../../shared/response");
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm',
]);
function extFromContentType(contentType) {
    const map = {
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic',
        'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
    };
    return map[contentType] ?? 'bin';
}
const handler = async (event) => {
    try {
        const body = JSON.parse(event.body ?? '{}');
        const { companionId, contentType, fileSize, caption, order } = body;
        if (!companionId)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('companionId is required'));
        if (!contentType)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('contentType is required'));
        if (!ALLOWED_TYPES.has(contentType))
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Unsupported file type'));
        if (fileSize && fileSize > MAX_FILE_SIZE)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('File too large (max 100 MB)'));
        const pk = (0, auth_1.getPk)(event);
        const companion = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `COMPANION#${companionId}` },
        }));
        if (!companion.Item)
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Companion not found'));
        const mediaId = (0, crypto_1.randomUUID)();
        const userId = pk.replace('USER#', '');
        const ext = extFromContentType(contentType);
        const key = `companions/${userId}/${mediaId}.${ext}`;
        const type = contentType.startsWith('video/') ? 'VIDEO' : 'IMAGE';
        const mediaOrder = typeof order === 'number' ? order : 0;
        await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `COMPANION#${companionId}` },
            UpdateExpression: 'SET #media = list_append(if_not_exists(#media, :empty), :newMedia)',
            ExpressionAttributeNames: { '#media': 'media' },
            ExpressionAttributeValues: {
                ':empty': [],
                ':newMedia': [{ id: mediaId, key, type, caption: caption ?? null, order: mediaOrder }],
            },
        }));
        const presignedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3, new client_s3_1.PutObjectCommand({
            Bucket: s3_1.PUBLIC_MEDIA_BUCKET,
            Key: key,
            ContentType: contentType,
        }), { expiresIn: s3_1.PRESIGN_EXPIRES });
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ url: presignedUrl, key, mediaId, type }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map