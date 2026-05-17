"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const id = event.pathParameters?.id;
        if (!id) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing network id'));
        }
        const pk = (0, auth_1.getPk)(event);
        // Step 1: Query all outposts belonging to this network
        const outpostsResult = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            FilterExpression: 'networkId = :nid',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'SF#FACILITY#',
                ':nid': id,
            },
        }));
        // Step 2: Delete each matching outpost
        await Promise.all((outpostsResult.Items ?? []).map(outpost => db_1.dynamo.send(new lib_dynamodb_1.DeleteCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: outpost.sk },
        }))));
        // Step 3: Delete the network itself
        await db_1.dynamo.send(new lib_dynamodb_1.DeleteCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `SF#NETWORK#${id}` },
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