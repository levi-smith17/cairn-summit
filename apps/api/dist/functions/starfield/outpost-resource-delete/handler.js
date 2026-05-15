"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const outpostId = event.pathParameters?.outpostId;
        const resourceId = event.pathParameters?.resourceId;
        if (!outpostId || !resourceId) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing outpostId or resourceId'));
        }
        const pk = (0, auth_1.getPk)(event);
        await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `SF#FACILITY#${outpostId}` },
            UpdateExpression: 'REMOVE #resources.#rid',
            ExpressionAttributeNames: {
                '#resources': 'resources',
                '#rid': resourceId,
            },
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