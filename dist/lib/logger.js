/**
 * Production-safe logging utility
 * Separates real system failures from expected controlled states
 */
const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
/**
 * Check if we should log at this level
 */
function shouldLog(level) {
    // Always log errors in all environments
    if (level === "error")
        return true;
    // In production, only log info and above (no debug)
    if (!isDevelopment && !isTest) {
        return level !== "debug";
    }
    // In development/test, log everything
    return true;
}
/**
 * Format log message with context
 */
function formatMessage(level, message, context) {
    const prefix = context?.component ? `[${context.component}]` : "[System]";
    return `${prefix} ${message}`;
}
/**
 * Debug logging - development only
 */
export function debug(message, context) {
    if (!shouldLog("debug"))
        return;
    console.debug(formatMessage("debug", message, context), context ?? "");
}
/**
 * Info logging - general operations
 */
export function info(message, context) {
    if (!shouldLog("info"))
        return;
    console.info(formatMessage("info", message, context), context ?? "");
}
/**
 * Warning logging - expected failures, recoverable states
 * Use for: config_error, scan_error, validation_error
 */
export function warn(message, context) {
    if (!shouldLog("warn"))
        return;
    console.warn(formatMessage("warn", message, context), context ?? "");
}
/**
 * Error logging - true system crashes only
 * Use for: unexpected exceptions, data corruption, unhandled errors
 */
export function error(message, context) {
    if (!shouldLog("error"))
        return;
    console.error(formatMessage("error", message, context), context ?? "");
}
/**
 * Audit-specific logging helpers
 * These provide consistent logging for audit operations
 */
export const auditLogger = {
    /**
     * Log expected configuration issues (not errors)
     */
    configMissing: (component) => {
        warn("API key not configured - service unavailable", { component, errorType: "config_error" });
    },
    /**
     * Log expected scan failures (not errors)
     */
    scanFailed: (component, url, reason) => {
        warn("Scan failed for URL", { component, url, errorType: "scan_error", reason });
    },
    /**
     * Log expected validation issues (not errors)
     */
    validationFailed: (component, url, details) => {
        warn("Validation failed", { component, url, errorType: "validation_error", details });
    },
    /**
     * Log successful scans
     */
    success: (component, url) => {
        info("Scan completed successfully", { component, url });
    },
    /**
     * Log true unexpected crashes only
     */
    crash: (component, error) => {
        console.error(`[${component}] Unexpected system crash:`, error);
    },
};
/**
 * Frontend-safe logging (no sensitive data)
 */
export const frontendLogger = {
    debug: (message, data) => {
        if (isDevelopment) {
            console.debug(`[Frontend] ${message}`, data ?? "");
        }
    },
    info: (message) => {
        console.info(`[Frontend] ${message}`);
    },
    warn: (message, context) => {
        console.warn(`[Frontend] ${message}`, context ?? "");
    },
    error: (message, error) => {
        console.error(`[Frontend] ${message}`, error ?? "");
    },
    /**
     * Log controlled state (config_error, scan_error) as warning
     * NOT as error - these are expected system states
     */
    expectedFailure: (errorType, userMessage) => {
        warn(`Expected failure handled: ${errorType}`, { userMessage });
    },
};
//# sourceMappingURL=logger.js.map