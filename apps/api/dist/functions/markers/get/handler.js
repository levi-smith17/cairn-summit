"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
function markerIdFromSk(sk) {
    return sk.replace('MARKER#', '');
}
const handler = async (event) => {
    try {
        const pk = (0, auth_1.getPk)(event);
        const [markersResult, waypointsResult] = await Promise.all([
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':prefix': 'MARKER#',
                },
            })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':prefix': 'WAYPOINT#',
                },
            })),
        ]);
        const waypointCounts = new Map();
        for (const waypoint of waypointsResult.Items ?? []) {
            for (const marker of (waypoint.markers ?? [])) {
                const id = marker.markerId ?? marker.id;
                if (!id)
                    continue;
                waypointCounts.set(id, (waypointCounts.get(id) ?? 0) + 1);
            }
        }
        const markers = (markersResult.Items ?? []).map(marker => ({
            ...marker,
            waypointCount: waypointCounts.get(markerIdFromSk(marker.sk)) ?? 0,
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(markers));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map