import type { APIGatewayProxyEventV2, APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
export declare function getPathId(event: APIGatewayProxyEventV2): string | undefined;
export declare function getUserId(event: APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer): string;
export declare function getPk(event: APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer): string;
//# sourceMappingURL=auth.d.ts.map