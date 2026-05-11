"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPathId = getPathId;
exports.getPk = getPk;
exports.getUserId = getUserId;
function getPathId(event) {
    return event.pathParameters?.id;
}
function getPk(event) {
    return `USER#${getUserId(event)}`;
}
function getUserId(event) {
    return event.requestContext.authorizer.jwt.claims.sub;
}
//# sourceMappingURL=auth.js.map