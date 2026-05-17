"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const id = event.pathParameters?.id;
        if (!id) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing resource id'));
        }
        await db_1.dynamo.send(new lib_dynamodb_1.DeleteCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: 'SF#RESOURCE', sk: `RESOURCE#${id}` },
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