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
        const settingsResult = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: profile.pk, sk: 'SETTINGS' },
        }));
        const settings = settingsResult.Item ?? {};
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
            },
            body: JSON.stringify({
                wayfarer: {
                    name: profile.name ?? null,
                    email: profile.email ?? null,
                    image: profile.image ?? null,
                    defaultTerminology: settings.defaultTerminology ?? 'CAIRN',
                    defaultTheme: settings.defaultTheme ?? 'SYSTEM',
                },
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