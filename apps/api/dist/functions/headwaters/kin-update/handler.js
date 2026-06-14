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
        if (!id)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing kin id'));
        const body = JSON.parse(event.body ?? '{}');
        if (!body.givenName || !body.surname) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('givenName and surname are required'));
        }
        const pk = (0, auth_1.getPk)(event);
        const now = new Date().toISOString();
        const setExpressions = [
            'givenName = :givenName',
            'surname = :surname',
            'fatherUnknown = :fatherUnknown',
            'motherUnknown = :motherUnknown',
            'bloodlines = :bloodlines',
            'updatedAt = :updatedAt',
        ];
        const removeExpressions = [];
        const expressionValues = {
            ':givenName': body.givenName,
            ':surname': body.surname,
            ':fatherUnknown': body.fatherUnknown ?? false,
            ':motherUnknown': body.motherUnknown ?? false,
            ':bloodlines': body.bloodlines ?? [],
            ':updatedAt': now,
        };
        const optionalFields = ['middleName', 'nickname', 'maidenName', 'birthDate', 'deathDate', 'fatherId', 'motherId'];
        for (const field of optionalFields) {
            if (body[field] !== undefined) {
                setExpressions.push(`${field} = :${field}`);
                expressionValues[`:${field}`] = body[field];
            }
            else {
                removeExpressions.push(field);
            }
        }
        if (body.isSelf === true) {
            setExpressions.push('isSelf = :isSelf');
            expressionValues[':isSelf'] = true;
        }
        let updateExpression = `SET ${setExpressions.join(', ')}`;
        if (removeExpressions.length > 0) {
            updateExpression += ` REMOVE ${removeExpressions.join(', ')}`;
        }
        const result = await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `KIN#${id}` },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionValues,
            ReturnValues: 'ALL_NEW',
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(result.Attributes));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map