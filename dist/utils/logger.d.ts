interface LogContext {
    url?: string;
    auditId?: string;
    error?: Error | unknown;
    duration?: number;
    [key: string]: unknown;
}
declare class Logger {
    private formatMessage;
    private sanitizeContext;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map