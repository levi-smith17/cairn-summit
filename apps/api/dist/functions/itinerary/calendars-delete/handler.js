"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_ssm_1 = require("@aws-sdk/client-ssm");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const ssm = new client_ssm_1.SSMClient({ region: process.env.AWS_REGION });
        const id = (0, auth_1.getPathId)(event);
        if (!id)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing itinerary id'));
        const pk = (0, auth_1.getPk)(event);
        const sk = `ITINERARY#${id}`;
        // Fetch first to get SSM path before deleting
        const existing = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({ TableName: db_1.TABLE_NAME, Key: { pk, sk } }));
        if (existing.Item?.ssmPasswordPath) {
            await ssm.send(new client_ssm_1.DeleteParameterCommand({ Name: existing.Item.ssmPasswordPath })).catch(() => {
                // SSM parameter may already be gone — not fatal
            });
        }
        await db_1.dynamo.send(new lib_dynamodb_1.DeleteCommand({ TableName: db_1.TABLE_NAME, Key: { pk, sk } }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.noContent)());
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map