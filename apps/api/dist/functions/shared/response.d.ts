import { ApiResponse } from '@cairn/types';
export declare function ok<T>(data: T): ApiResponse<T>;
export declare function created<T>(data: T): ApiResponse<T>;
export declare function noContent(): ApiResponse<never>;
export declare function badRequest(message?: string): ApiResponse<never>;
export declare function unauthorized(message?: string): ApiResponse<never>;
export declare function forbidden(message?: string): ApiResponse<never>;
export declare function notFound(message?: string): ApiResponse<never>;
export declare function tooManyRequests(message?: string): ApiResponse<never>;
export declare function conflict(message?: string): ApiResponse<never>;
export declare function serverError(message?: string): ApiResponse<never>;
export declare function toApiGatewayResponse<T>(response: ApiResponse<T>): {
    statusCode: number;
    headers: {
        'Content-Type': string;
        'Access-Control-Allow-Origin': string;
    };
    body: string;
};
//# sourceMappingURL=response.d.ts.map