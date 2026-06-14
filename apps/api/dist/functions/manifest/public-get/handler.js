"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const username = event.pathParameters?.username;
        if (!username)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('username is required'));
        // Scan is acceptable — low-frequency public endpoint, small table
        const scan = await db_1.dynamo.send(new lib_dynamodb_1.ScanCommand({
            TableName: db_1.TABLE_NAME,
            FilterExpression: 'sk = :sk AND username = :username',
            ExpressionAttributeValues: { ':sk': 'PROFILE', ':username': username },
        }));
        const profile = scan.Items?.[0];
        if (!profile)
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('User not found'));
        const pk = profile.pk;
        const [settingsResult, expeditionsResult, trainingResult, gearResult, landmarksResult, summitsResult, pathfindingResult,] = await Promise.all([
            db_1.dynamo.send(new lib_dynamodb_1.GetCommand({ TableName: db_1.TABLE_NAME, Key: { pk, sk: 'SETTINGS' } })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({ TableName: db_1.TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'EXPEDITION#' } })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({ TableName: db_1.TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'TRAINING#' } })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({ TableName: db_1.TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'GEAR#' } })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({ TableName: db_1.TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'LANDMARK#' } })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({ TableName: db_1.TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'SUMMIT#' } })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({ TableName: db_1.TABLE_NAME, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)', ExpressionAttributeValues: { ':pk': pk, ':prefix': 'PATHFINDING#' } })),
        ]);
        const settings = settingsResult.Item ?? {};
        const addId = (items, prefix) => items.map(item => ({ ...item, id: item.sk.replace(`${prefix}#`, '') }));
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
            },
            body: JSON.stringify({
                wayfarer: {
                    username: profile.username ?? null,
                    name: profile.name ?? null,
                    email: profile.email ?? null,
                    image: profile.image ?? null,
                    defaultTerminology: settings.defaultTerminology ?? 'CAIRN',
                    defaultTheme: settings.defaultTheme ?? 'SYSTEM',
                },
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
            }),
        };
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map