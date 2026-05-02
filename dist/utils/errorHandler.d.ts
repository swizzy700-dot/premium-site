export declare class AuditError extends Error {
    readonly code: string;
    readonly retryable: boolean;
    readonly statusCode: number;
    constructor(options: {
        message: string;
        code: string;
        retryable?: boolean;
        statusCode?: number;
        cause?: Error;
    });
}
export declare enum ErrorCodes {
    INVALID_URL = "INVALID_URL",
    URL_NOT_ACCESSIBLE = "URL_NOT_ACCESSIBLE",
    URL_BLOCKED = "URL_BLOCKED",
    BROWSER_LAUNCH_FAILED = "BROWSER_LAUNCH_FAILED",
    PAGE_LOAD_FAILED = "PAGE_LOAD_FAILED",
    PAGE_TIMEOUT = "PAGE_TIMEOUT",
    EMPTY_DOM = "EMPTY_DOM",
    CAPTCHA_DETECTED = "CAPTCHA_DETECTED",
    LIGHTHOUSE_FAILED = "LIGHTHOUSE_FAILED",
    AUDIT_TIMEOUT = "AUDIT_TIMEOUT",
    AI_ANALYSIS_FAILED = "AI_ANALYSIS_FAILED",
    AI_TIMEOUT = "AI_TIMEOUT",
    QUEUE_ERROR = "QUEUE_ERROR",
    JOB_NOT_FOUND = "JOB_NOT_FOUND",
    DATABASE_ERROR = "DATABASE_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    RATE_LIMITED = "RATE_LIMITED",
    INTERNAL_ERROR = "INTERNAL_ERROR"
}
interface ErrorResponse {
    success: false;
    status: 'failed';
    error: {
        code: string;
        message: string;
        retryable: boolean;
    };
    url?: string;
    auditId?: string;
}
export declare function handleError(error: unknown, url?: string, auditId?: string): ErrorResponse;
export declare function isRetryableError(error: unknown): boolean;
export declare function detectBlockedSite(error: unknown): boolean;
export {};
//# sourceMappingURL=errorHandler.d.ts.map