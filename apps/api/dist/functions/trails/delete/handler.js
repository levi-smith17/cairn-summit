"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const id = (0, auth_1.getPathId)(event);
        if (!id) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing trail id'));
        }
        const pk = (0, auth_1.getPk)(event);
        // Find all waypoints assigned to this trail via GSI1
        const waypointsResult = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            IndexName: 'gsi1',
            KeyConditionExpression: 'gsi1pk = :gsi1pk AND begins_with(gsi1sk, :prefix)',
            ExpressionAttributeValues: {
                ':gsi1pk': `TRAIL#${id}`,
                ':prefix': 'WAYPOINT#',
            },
        }));
        await Promise.all([
            db_1.dynamo.send(new lib_dynamodb_1.DeleteCommand({
                TableName: db_1.TABLE_NAME,
                Key: { pk, sk: `TRAIL#${id}` },
            })),
            ...(waypointsResult.Items ?? []).map(w => db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
                TableName: db_1.TABLE_NAME,
                Key: { pk, sk: w.sk },
                UpdateExpression: 'REMOVE trailId, gsi1pk, gsi1sk',
            }))),
        ]);
        return (0, response_1.toApiGatewayResponse)((0, response_1.noContent)());
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map