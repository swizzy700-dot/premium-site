/**
 * Production-safe logging utility
 * Separates real system failures from expected controlled states
 */
interface LogContext {
    component?: string;
    url?: string;
    errorType?: string;
    [key: string]: unknown;
}
/**
 * Debug logging - development only
 */
export declare function debug(message: string, context?: LogContext): void;
/**
 * Info logging - general operations
 */
export declare function info(message: string, context?: LogContext): void;
/**
 * Warning logging - expected failures, recoverable states
 * Use for: config_error, scan_error, validation_error
 */
export declare function warn(message: string, context?: LogContext): void;
/**
 * Error logging - true system crashes only
 * Use for: unexpected exceptions, data corruption, unhandled errors
 */
export declare function error(message: string, context?: LogContext): void;
/**
 * Audit-specific logging helpers
 * These provide consistent logging for audit operations
 */
export declare const auditLogger: {
    /**
     * Log expected configuration issues (not errors)
     */
    configMissing: (component: string) => void;
    /**
     * Log expected scan failures (not errors)
     */
    scanFailed: (component: string, url: string, reason: unknown) => void;
    /**
     * Log expected validation issues (not errors)
     */
    validationFailed: (component: string, url: string, details: unknown) => void;
    /**
     * Log successful scans
     */
    success: (component: string, url: string) => void;
    /**
     * Log true unexpected crashes only
     */
    crash: (component: string, error: unknown) => void;
};
/**
 * Frontend-safe logging (no sensitive data)
 */
export declare const frontendLogger: {
    debug: (message: string, data?: unknown) => void;
    info: (message: string) => void;
    warn: (message: string, context?: unknown) => void;
    error: (message: string, error?: unknown) => void;
    /**
     * Log controlled state (config_error, scan_error) as warning
     * NOT as error - these are expected system states
     */
    expectedFailure: (errorType: string, userMessage: string) => void;
};
export {};
//# sourceMappingURL=logger.d.ts.map