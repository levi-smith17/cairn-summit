"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const auth_1 = require("../../shared/auth");
const s3_1 = require("../../shared/s3");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const key = event.queryStringParameters?.key;
        if (!key)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('key is required'));
        const userId = (0, auth_1.getUserId)(event);
        // Verify the key is scoped to this user
        if (!key.startsWith(`logs/${userId}/`)) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.forbidden)('Access denied'));
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