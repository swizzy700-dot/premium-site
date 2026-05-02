import { logger } from './logger';
export class AuditError extends Error {
    code;
    retryable;
    statusCode;
    constructor(options) {
        super(options.message, { cause: options.cause });
        this.name = 'AuditError';
        this.code = options.code;
        this.retryable = options.retryable ?? false;
        this.statusCode = options.statusCode ?? 500;
    }
}
export var ErrorCodes;
(function (ErrorCodes) {
    // URL Errors
    ErrorCodes["INVALID_URL"] = "INVALID_URL";
    ErrorCodes["URL_NOT_ACCESSIBLE"] = "URL_NOT_ACCESSIBLE";
    ErrorCodes["URL_BLOCKED"] = "URL_BLOCKED";
    // Puppeteer Errors
    ErrorCodes["BROWSER_LAUNCH_FAILED"] = "BROWSER_LAUNCH_FAILED";
    ErrorCodes["PAGE_LOAD_FAILED"] = "PAGE_LOAD_FAILED";
    ErrorCodes["PAGE_TIMEOUT"] = "PAGE_TIMEOUT";
    ErrorCodes["EMPTY_DOM"] = "EMPTY_DOM";
    ErrorCodes["CAPTCHA_DETECTED"] = "CAPTCHA_DETECTED";
    // Lighthouse Errors
    ErrorCodes["LIGHTHOUSE_FAILED"] = "LIGHTHOUSE_FAILED";
    ErrorCodes["AUDIT_TIMEOUT"] = "AUDIT_TIMEOUT";
    // AI Errors
    ErrorCodes["AI_ANALYSIS_FAILED"] = "AI_ANALYSIS_FAILED";
    ErrorCodes["AI_TIMEOUT"] = "AI_TIMEOUT";
    // Queue Errors
    ErrorCodes["QUEUE_ERROR"] = "QUEUE_ERROR";
    ErrorCodes["JOB_NOT_FOUND"] = "JOB_NOT_FOUND";
    // Database Errors
    ErrorCodes["DATABASE_ERROR"] = "DATABASE_ERROR";
    // General Errors
    ErrorCodes["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
    ErrorCodes["RATE_LIMITED"] = "RATE_LIMITED";
    ErrorCodes["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(ErrorCodes || (ErrorCodes = {}));
export function handleError(error, url, auditId) {
    if (error instanceof AuditError) {
        logger.error(`AuditError: ${error.message}`, {
            code: error.code,
            url,
            auditId,
            retryable: error.retryable,
        });
        return {
            success: false,
            status: 'failed',
            error: {
                code: error.code,
                message: error.message,
                retryable: error.retryable,
            },
            url,
            auditId,
        };
    }
    // Handle standard Error
    if (error instanceof Error) {
        logger.error(`Unexpected error: ${error.message}`, {
            url,
            auditId,
            error,
        });
        return {
            success: false,
            status: 'failed',
            error: {
                code: ErrorCodes.UNKNOWN_ERROR,
                message: 'An unexpected error occurred',
                retryable: true,
            },
            url,
            auditId,
        };
    }
    // Unknown error type
    logger.error('Unknown error type', { url, auditId, error });
    return {
        success: false,
        status: 'failed',
        error: {
            code: ErrorCodes.UNKNOWN_ERROR,
            message: 'An unexpected error occurred',
            retryable: true,
        },
        url,
        auditId,
    };
}
export function isRetryableError(error) {
    if (error instanceof AuditError) {
        return error.retryable;
    }
    // Network and timeout errors are retryable
    if (error instanceof Error) {
        const retryableMessages = [
            'timeout',
            'network',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            'socket hang up',
        ];
        return retryableMessages.some(msg => error.message.toLowerCase().includes(msg.toLowerCase()));
    }
    return false;
}
export function detectBlockedSite(error) {
    if (!(error instanceof Error))
        return false;
    const blockedIndicators = [
        '403',
        'captcha',
        'access denied',
        'forbidden',
        'blocked',
        'cloudflare',
        'rate limit',
    ];
    return blockedIndicators.some(indicator => error.message.toLowerCase().includes(indicator.toLowerCase()));
}
//# sourceMappingURL=errorHandler.js.map