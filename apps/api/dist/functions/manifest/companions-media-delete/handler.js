"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const auth_1 = require("../../shared/auth");
const s3_1 = require("../../shared/s3");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const key = event.queryStringParameters?.key;
        if (!key)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('key is required'));
        const userId = (0, auth_1.getUserId)(event);
        if (!key.startsWith(`companions/${userId}/`)) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.forbidden)('Access denied'));
        }
        await s3_1.s3.send(new client_s3_1.DeleteObjectCommand({
            Bucket: s3_1.PUBLIC_MEDIA_BUCKET,
            Key: key,
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