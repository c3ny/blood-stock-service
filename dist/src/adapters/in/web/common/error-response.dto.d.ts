export declare class ErrorResponseDTO {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
    traceId: string;
}
export declare class ValidationErrorResponseDTO {
    statusCode: number;
    code: string;
    message: string;
    details: unknown;
    traceId: string;
}
export declare class InsufficientStockErrorDTO {
    statusCode: number;
    code: string;
    message: string;
    details: unknown;
    traceId: string;
}
