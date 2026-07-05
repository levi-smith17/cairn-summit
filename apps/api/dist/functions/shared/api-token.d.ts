export declare const API_TOKEN_PREFIX = "csk_";
export type ApiTokenRecord = {
    pk: string;
    sk: 'API_TOKEN';
    tokenHash: string;
    tokenPrefix: string;
    createdAt: string;
    lastUsedAt?: string;
};
export type ApiTokenLookupRecord = {
    pk: string;
    sk: 'META';
    userId: string;
    tokenPrefix: string;
    createdAt: string;
};
export declare function generateApiToken(): string;
export declare function hashApiToken(token: string): string;
export declare function isApiToken(value: string): boolean;
export declare function tokenLookupPk(token: string): string;
export declare function userTokenPk(userId: string): string;
export declare function tokenPrefixFromToken(token: string): string;
//# sourceMappingURL=api-token.d.ts.map