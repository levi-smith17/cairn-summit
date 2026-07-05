"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_TOKEN_PREFIX = void 0;
exports.generateApiToken = generateApiToken;
exports.hashApiToken = hashApiToken;
exports.isApiToken = isApiToken;
exports.tokenLookupPk = tokenLookupPk;
exports.userTokenPk = userTokenPk;
exports.tokenPrefixFromToken = tokenPrefixFromToken;
const node_crypto_1 = require("node:crypto");
exports.API_TOKEN_PREFIX = 'csk_';
function generateApiToken() {
    return `${exports.API_TOKEN_PREFIX}${(0, node_crypto_1.randomBytes)(32).toString('base64url')}`;
}
function hashApiToken(token) {
    return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
}
function isApiToken(value) {
    return value.startsWith(exports.API_TOKEN_PREFIX);
}
function tokenLookupPk(token) {
    return `TOKEN#${hashApiToken(token)}`;
}
function userTokenPk(userId) {
    return `USER#${userId}`;
}
function tokenPrefixFromToken(token) {
    return token.slice(0, exports.API_TOKEN_PREFIX.length + 8);
}
//# sourceMappingURL=api-token.js.map