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
        const body = JSON.parse(event.body ?? '{}');
        if (typeof body.onsite !== 'boolean') {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('onsite is required and must be a boolean'));
        }
        // Step 1: Fetch the global resource to get name and abbreviation
        const resourceResult = await db_1.dynamo.send(new lib_dynamodb_1.BatchGetCommand({
            RequestItems: {
                [db_1.TABLE_NAME]: {
                    Keys: [{ pk: 'SF#RESOURCE', sk: `RESOURCE#${resourceId}` }],
                },
            },
        }));
        const resourceItem = resourceResult.Responses?.[db_1.TABLE_NAME]?.[0];
        if (!resourceItem) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Resource not found'));
        }
        const pk = (0, auth_1.getPk)(event);
        const supplies = Array.isArray(body.supplies) ? body.supplies : [];
        // Step 2: Upsert the resource entry on the outpost
        await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `SF#FACILITY#${outpostId}` },
            UpdateExpression: 'SET #resources.#rid = :value',
            ExpressionAttributeNames: {
                '#resources': 'resources',
                '#rid': resourceId,
            },
            ExpressionAttributeValues: {
                ':value': {
                    resourceId,
                    name: resourceItem.name,
                    abbreviation: resourceItem.abbreviation,
                    onsite: body.onsite,
                    origin: body.origin ?? false,
                    supplies: body.onsite ? [] : supplies,
                },
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