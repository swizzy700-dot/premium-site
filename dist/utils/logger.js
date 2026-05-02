class Logger {
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` ${JSON.stringify(this.sanitizeContext(context))}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
    }
    sanitizeContext(context) {
        const sanitized = {};
        for (const [key, value] of Object.entries(context)) {
            if (key === 'error' && value instanceof Error) {
                sanitized[key] = {
                    message: value.message,
                    stack: value.stack,
                    name: value.name,
                };
            }
            else if (key !== 'apiKey' && key !== 'password' && key !== 'secret') {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    info(message, context) {
        console.log(this.formatMessage('info', message, context));
    }
    warn(message, context) {
        console.warn(this.formatMessage('warn', message, context));
    }
    error(message, context) {
        console.error(this.formatMessage('error', message, context));
    }
    debug(message, context) {
        if (process.env.DEBUG === 'true') {
            console.log(this.formatMessage('debug', message, context));
        }
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map