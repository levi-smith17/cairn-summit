"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const pk = (0, auth_1.getPk)(event);
        const [profileResult, expeditionsResult, trainingResult, gearResult, landmarksResult, summitsResult, pathfindingResult, companionsResult,] = await Promise.all([
            db_1.dynamo.send(new lib_dynamodb_1.GetCommand({ TableName: db_1.TABLE_NAME, Key: { pk, sk: 'PROFILE' } })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({ TableName: db_1.TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'EXPEDITION#' } })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({ TableName: db_1.TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'TRAINING#' } })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({ TableName: db_1.TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'GEAR#' } })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({ TableName: db_1.TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'LANDMARK#' } })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({ TableName: db_1.TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'SUMMIT#' } })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({ TableName: db_1.TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'PATHFINDING#' } })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({ TableName: db_1.TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'COMPANION#' } })),
        ]);
        const profile = profileResult.Item ?? {};
        const addId = (items, prefix) => items.map(item => ({
            ...item,
            id: item.sk.replace(`${prefix}#`, ''),
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({
            user: {
                name: profile.name ?? null,
                email: profile.email ?? null,
                image: profile.image ?? null,
            },
            username: profile.username ?? null,
            origins: {
                headline: profile.headline ?? null,
                summary: profile.summary ?? null,
                bio: profile.bio ?? null,
                location: profile.location ?? null,
                website: profile.website ?? null,
                linkedin: profile.linkedin ?? null,
                github: profile.github ?? null,
            },
            expeditions: addId(expeditionsResult.Items ?? [], 'EXPEDITION'),
            training: addId(trainingResult.Items ?? [], 'TRAINING'),
            gear: addId(gearResult.Items ?? [], 'GEAR'),
            landmarks: addId(landmarksResult.Items ?? [], 'LANDMARK'),
            summits: addId(summitsResult.Items ?? [], 'SUMMIT'),
            pathfinding: addId(pathfindingResult.Items ?? [], 'PATHFINDING'),
            companions: addId(companionsResult.Items ?? [], 'COMPANION'),
        }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map