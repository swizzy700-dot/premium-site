/**
 * Production-safe logging utility
 * Separates real system failures from expected controlled states
 */

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

/**
 * Log levels:
 * - debug: Development only, verbose debugging
 * - info: General operational information
 * - warn: Recoverable issues, expected failures (config_error, scan_error)
 * - error: True system crashes, unexpected failures
 */
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  component?: string;
  url?: string;
  errorType?: string;
  [key: string]: unknown;
}

/**
 * Check if we should log at this level
 */
function shouldLog(level: LogLevel): boolean {
  // Always log errors in all environments
  if (level === "error") return true;
  
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
function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const prefix = context?.component ? `[${context.component}]` : "[System]";
  return `${prefix} ${message}`;
}

/**
 * Debug logging - development only
 */
export function debug(message: string, context?: LogContext): void {
  if (!shouldLog("debug")) return;
  console.debug(formatMessage("debug", message, context), context ?? "");
}

/**
 * Info logging - general operations
 */
export function info(message: string, context?: LogContext): void {
  if (!shouldLog("info")) return;
  console.info(formatMessage("info", message, context), context ?? "");
}

/**
 * Warning logging - expected failures, recoverable states
 * Use for: config_error, scan_error, validation_error
 */
export function warn(message: string, context?: LogContext): void {
  if (!shouldLog("warn")) return;
  console.warn(formatMessage("warn", message, context), context ?? "");
}

/**
 * Error logging - true system crashes only
 * Use for: unexpected exceptions, data corruption, unhandled errors
 */
export function error(message: string, context?: LogContext): void {
  if (!shouldLog("error")) return;
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
  configMissing: (component: string) => {
    warn("API key not configured - service unavailable", { component, errorType: "config_error" });
  },

  /**
   * Log expected scan failures (not errors)
   */
  scanFailed: (component: string, url: string, reason: unknown) => {
    warn("Scan failed for URL", { component, url, errorType: "scan_error", reason });
  },

  /**
   * Log expected validation issues (not errors)
   */
  validationFailed: (component: string, url: string, details: unknown) => {
    warn("Validation failed", { component, url, errorType: "validation_error", details });
  },

  /**
   * Log successful scans
   */
  success: (component: string, url: string) => {
    info("Scan completed successfully", { component, url });
  },

  /**
   * Log true unexpected crashes only
   */
  crash: (component: string, error: unknown) => {
    console.error(`[${component}] Unexpected system crash:`, error);
  },
};

/**
 * Frontend-safe logging (no sensitive data)
 */
export const frontendLogger = {
  debug: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.debug(`[Frontend] ${message}`, data ?? "");
    }
  },

  info: (message: string) => {
    console.info(`[Frontend] ${message}`);
  },

  warn: (message: string, context?: unknown) => {
    console.warn(`[Frontend] ${message}`, context ?? "");
  },

  error: (message: string, error?: unknown) => {
    console.error(`[Frontend] ${message}`, error ?? "");
  },

  /**
   * Log controlled state (config_error, scan_error) as warning
   * NOT as error - these are expected system states
   */
  expectedFailure: (errorType: string, userMessage: string) => {
    warn(`Expected failure handled: ${errorType}`, { userMessage });
  },
};
