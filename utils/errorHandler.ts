import { logger } from './logger';

export class AuditError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly statusCode: number;

  constructor(options: {
    message: string;
    code: string;
    retryable?: boolean;
    statusCode?: number;
    cause?: Error;
  }) {
    super(options.message, { cause: options.cause });
    this.name = 'AuditError';
    this.code = options.code;
    this.retryable = options.retryable ?? false;
    this.statusCode = options.statusCode ?? 500;
  }
}

export enum ErrorCodes {
  // URL Errors
  INVALID_URL = 'INVALID_URL',
  URL_NOT_ACCESSIBLE = 'URL_NOT_ACCESSIBLE',
  URL_BLOCKED = 'URL_BLOCKED',
  
  // Puppeteer Errors
  BROWSER_LAUNCH_FAILED = 'BROWSER_LAUNCH_FAILED',
  PAGE_LOAD_FAILED = 'PAGE_LOAD_FAILED',
  PAGE_TIMEOUT = 'PAGE_TIMEOUT',
  EMPTY_DOM = 'EMPTY_DOM',
  CAPTCHA_DETECTED = 'CAPTCHA_DETECTED',
  
  // Lighthouse Errors
  LIGHTHOUSE_FAILED = 'LIGHTHOUSE_FAILED',
  AUDIT_TIMEOUT = 'AUDIT_TIMEOUT',
  
  // AI Errors
  AI_ANALYSIS_FAILED = 'AI_ANALYSIS_FAILED',
  AI_TIMEOUT = 'AI_TIMEOUT',
  
  // Queue Errors
  QUEUE_ERROR = 'QUEUE_ERROR',
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  
  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // General Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
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

export function handleError(error: unknown, url?: string, auditId?: string): ErrorResponse {
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

export function isRetryableError(error: unknown): boolean {
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
    
    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }
  
  return false;
}

export function detectBlockedSite(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const blockedIndicators = [
    '403',
    'captcha',
    'access denied',
    'forbidden',
    'blocked',
    'cloudflare',
    'rate limit',
  ];
  
  return blockedIndicators.some(indicator =>
    error.message.toLowerCase().includes(indicator.toLowerCase())
  );
}
