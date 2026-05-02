type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  url?: string;
  auditId?: string;
  error?: Error | unknown;
  duration?: number;
  [key: string]: unknown;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(this.sanitizeContext(context))}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private sanitizeContext(context: LogContext): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(context)) {
      if (key === 'error' && value instanceof Error) {
        sanitized[key] = {
          message: value.message,
          stack: value.stack,
          name: value.name,
        };
      } else if (key !== 'apiKey' && key !== 'password' && key !== 'secret') {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.DEBUG === 'true') {
      console.log(this.formatMessage('debug', message, context));
    }
  }
}

export const logger = new Logger();
