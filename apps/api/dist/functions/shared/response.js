"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.created = created;
exports.noContent = noContent;
exports.badRequest = badRequest;
exports.unauthorized = unauthorized;
exports.forbidden = forbidden;
exports.notFound = notFound;
exports.tooManyRequests = tooManyRequests;
exports.conflict = conflict;
exports.serverError = serverError;
exports.toApiGatewayResponse = toApiGatewayResponse;
function ok(data) {
    return {
        statusCode: 200,
        data
    };
}
function created(data) {
    return {
        statusCode: 201,
        data
    };
}
function noContent() {
    return {
        statusCode: 204
    };
}
function badRequest(message = 'Bad request') {
    return {
        statusCode: 400,
        error: message
    };
}
function unauthorized(message = 'Unauthorized') {
    return {
        statusCode: 401,
        error: message
    };
}
function forbidden(message = 'Forbidden') {
    return {
        statusCode: 403,
        error: message
    };
}
function notFound(message = 'Not found') {
    return {
        statusCode: 404,
        error: message
    };
}
function tooManyRequests(message = 'Too many requests') {
    return {
        statusCode: 429,
        error: message
    };
}
function conflict(message = 'Conflict') {
    return {
        statusCode: 409,
        error: message
    };
}
function serverError(message = 'Internal server error') {
    return {
        statusCode: 500,
        error: message
    };
}
function toApiGatewayResponse(response) {
    return {
        statusCode: response.statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(response.error ? { error: response.error } : { data: response.data })
    };
}
//# sourceMappingURL=response.js.map