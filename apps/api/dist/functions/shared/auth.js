"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPathId = getPathId;
exports.getUserId = getUserId;
exports.getPk = getPk;
function getPathId(event) {
    return event.pathParameters?.id;
}
function getUserId(event) {
    const authorizer = event.requestContext.authorizer;
    const lambdaSub = authorizer?.lambda?.sub;
    if (typeof lambdaSub === 'string' && lambdaSub.length > 0) {
        return lambdaSub;
    }
    const jwtSub = authorizer?.jwt?.claims?.sub;
    if (typeof jwtSub === 'string' && jwtSub.length > 0) {
        return jwtSub;
    }
    throw new Error('Unauthorized');
}
function getPk(event) {
    return `USER#${getUserId(event)}`;
}
//# sourceMappingURL=auth.js.map