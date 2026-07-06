"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const api_token_1 = require("../../shared/api-token");
const region = process.env.AWS_REGION ?? 'us-east-2';
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;
let josePromise = null;
let jwks = null;
async function loadJose() {
    if (!josePromise) {
        // tsc downlevels `import('jose')` to require() under CommonJS; use native import instead.
        josePromise = new Function('return import("jose")')();
    }
    return josePromise;
}
function extractBearerToken(event) {
    const fromHeader = parseBearerToken(event.headers?.authorization ?? event.headers?.Authorization);
    if (fromHeader)
        return fromHeader;
    for (const source of event.identitySource ?? []) {
        const fromSource = parseBearerToken(source);
        if (fromSource)
            return fromSource;
    }
    return null;
}
function parseBearerToken(header) {
    if (!header)
        return null;
    const trimmed = header.trim();
    const bearerMatch = /^Bearer\s+(.+)$/i.exec(trimmed);
    if (bearerMatch?.[1])
        return bearerMatch[1];
    // Cairn web sends Cognito ID tokens directly in Authorization (no Bearer prefix).
    // The old API Gateway JWT authorizer accepted this format.
    if (/^csk_/.test(trimmed) || /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(trimmed)) {
        return trimmed;
    }
    return null;
}
async function verifyJwt(token) {
    if (!userPoolId || !clientId) {
        throw new Error('Cognito env vars missing');
    }
    const jose = await loadJose();
    if (!jwks) {
        jwks = jose.createRemoteJWKSet(new URL(`https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`));
    }
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    const { payload } = await jose.jwtVerify(token, jwks, {
        issuer,
        audience: clientId,
    });
    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    if (!sub)
        throw new Error('Missing sub claim');
    return {
        sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
    };
}
async function verifyApiToken(token) {
    const lookup = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
        TableName: db_1.TABLE_NAME,
        Key: {
            pk: (0, api_token_1.tokenLookupPk)(token),
            sk: 'META',
        },
    }));
    const userId = lookup.Item?.userId;
    if (typeof userId !== 'string' || !userId) {
        throw new Error('Invalid API token');
    }
    const tokenHash = (0, api_token_1.hashApiToken)(token);
    await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
        TableName: db_1.TABLE_NAME,
        Key: {
            pk: `USER#${userId}`,
            sk: 'API_TOKEN',
        },
        UpdateExpression: 'SET lastUsedAt = :lastUsedAt',
        ConditionExpression: 'tokenHash = :tokenHash',
        ExpressionAttributeValues: {
            ':lastUsedAt': new Date().toISOString(),
            ':tokenHash': tokenHash,
        },
    })).catch(() => {
        // Ignore races or missing user record — lookup already validated token existence.
    });
    return { sub: userId };
}
const handler = async (event) => {
    try {
        const token = extractBearerToken(event);
        if (!token) {
            console.warn('Authorizer denied: missing bearer token');
            return { isAuthorized: false };
        }
        if ((0, api_token_1.isApiToken)(token)) {
            const user = await verifyApiToken(token);
            return {
                isAuthorized: true,
                context: {
                    sub: user.sub,
                    authType: 'api_token',
                },
            };
        }
        const user = await verifyJwt(token);
        return {
            isAuthorized: true,
            context: {
                sub: user.sub,
                email: user.email ?? '',
                authType: 'jwt',
            },
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Authorizer failed', message);
        return { isAuthorized: false };
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map