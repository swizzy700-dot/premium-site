/**
 * Security layer for API protection
 * Rate limiting, abuse detection, and request validation
 */

import { logger } from '../utils/logger';

// Rate limiting storage (Redis preferred, fallback to memory)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    lastRequest: number;
    urlHistory: string[];
  };
}

const rateLimitStore: RateLimitStore = {};
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute
const COOLDOWN_PERIOD = 30 * 1000; // 30 seconds cooldown for abuse
const MAX_URL_LENGTH = 2048;
const CONCURRENT_AUDITS = new Set<string>();
const MAX_CONCURRENT = 3;

/**
 * Get client identifier from request
 */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const apiKey = request.headers.get('x-api-key');
  
  // Use API key if provided, otherwise use IP
  if (apiKey) {
    return `api:${apiKey}`;
  }
  
  return forwarded?.split(',')[0]?.trim() || 
         realIp || 
         'anonymous';
}

/**
 * Validate API key
 */
export function validateApiKey(request: Request): { valid: boolean; error?: string } {
  const apiKey = request.headers.get('x-api-key');
  
  // If API key is required but missing
  if (!apiKey) {
    return { valid: false, error: 'Missing API key' };
  }
  
  // Validate against environment variable
  const validKey = process.env.API_KEY;
  if (validKey && apiKey !== validKey) {
    return { valid: false, error: 'Invalid API key' };
  }
  
  return { valid: true };
}

/**
 * Check rate limit for client
 */
export function checkRateLimit(clientId: string): { 
  allowed: boolean; 
  remaining: number;
  resetIn: number;
  blocked?: boolean;
} {
  const now = Date.now();
  
  // Clean old entries
  if (rateLimitStore[clientId] && rateLimitStore[clientId].resetTime < now) {
    delete rateLimitStore[clientId];
  }
  
  // Initialize if not exists
  if (!rateLimitStore[clientId]) {
    rateLimitStore[clientId] = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW,
      lastRequest: 0,
      urlHistory: [],
    };
  }
  
  const entry = rateLimitStore[clientId];
  
  // Check cooldown for abuse
  if (entry.lastRequest && now - entry.lastRequest < COOLDOWN_PERIOD) {
    const rapidRequests = entry.urlHistory.filter(
      url => now - parseInt(url.split(':')[1] || '0') < COOLDOWN_PERIOD
    ).length;
    
    if (rapidRequests > 3) {
      logger.warn(`Abuse detected for client ${clientId.substring(0, 20)}`);
      return { 
        allowed: false, 
        remaining: 0, 
        resetIn: COOLDOWN_PERIOD,
        blocked: true 
      };
    }
  }
  
  // Check rate limit
  if (entry.count >= RATE_LIMIT_MAX) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: entry.resetTime - now 
    };
  }
  
  // Increment counter
  entry.count++;
  entry.lastRequest = now;
  
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX - entry.count, 
    resetIn: entry.resetTime - now 
  };
}

/**
 * Check for duplicate/rapid URL requests (abuse prevention)
 */
export function checkDuplicateRequest(clientId: string, url: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore[clientId];
  
  if (!entry) return false;
  
  // Check if same URL was requested recently
  const recentUrls = entry.urlHistory.filter(u => {
    const [storedUrl, timestamp] = u.split('|');
    return now - parseInt(timestamp) < 5000; // 5 seconds
  });
  
  const isDuplicate = recentUrls.some(u => u.startsWith(url + '|'));
  
  // Update history
  entry.urlHistory = [...recentUrls, `${url}|${now}`].slice(-10);
  
  return isDuplicate;
}

/**
 * Comprehensive URL validation for SSRF prevention
 */
export function validateUrlSecurity(url: string): { valid: boolean; error?: string } {
  // Check length
  if (url.length > MAX_URL_LENGTH) {
    return { valid: false, error: 'URL exceeds maximum length' };
  }
  
  // Trim and basic sanitization
  const trimmed = url.trim();
  
  // Check for injection attempts
  if (trimmed.includes('\n') || trimmed.includes('\r') || trimmed.includes('\0')) {
    return { valid: false, error: 'Invalid characters in URL' };
  }
  
  // Parse URL
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  // Only allow http/https
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
  }
  
  const hostname = parsed.hostname.toLowerCase();
  
  // Block localhost variations
  if (hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname === '0.0.0.0' ||
      hostname === '[::1]' ||
      hostname === '[::]' ||
      hostname === '::1') {
    return { valid: false, error: 'Internal addresses are not allowed' };
  }
  
  // Block private IP ranges
  if (hostname.startsWith('10.')) {
    return { valid: false, error: 'Private IP ranges are not allowed' };
  }
  
  if (hostname.startsWith('192.168.')) {
    return { valid: false, error: 'Private IP ranges are not allowed' };
  }
  
  if (hostname.startsWith('172.')) {
    const secondOctet = parseInt(hostname.split('.')[1]);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return { valid: false, error: 'Private IP ranges are not allowed' };
    }
  }
  
  if (hostname.startsWith('127.')) {
    return { valid: false, error: 'Loopback addresses are not allowed' };
  }
  
  if (hostname.startsWith('169.254.')) {
    return { valid: false, error: 'Link-local addresses are not allowed' };
  }
  
  if (hostname.startsWith('fc00:') || hostname.startsWith('fd00:')) {
    return { valid: false, error: 'IPv6 private addresses are not allowed' };
  }
  
  // Block file protocol
  if (parsed.protocol === 'file:') {
    return { valid: false, error: 'File URLs are not allowed' };
  }
  
  // Check for valid TLD (must have at least one dot)
  if (!hostname.includes('.') || hostname.endsWith('.')) {
    return { valid: false, error: 'Invalid domain name' };
  }
  
  // Block common internal domains
  const blockedDomains = [
    'internal',
    'intranet',
    'local',
    'localhost.localdomain',
  ];
  
  if (blockedDomains.some(d => hostname.includes(d))) {
    return { valid: false, error: 'Internal domain names are not allowed' };
  }
  
  // Validate port (only standard ports)
  if (parsed.port && !['80', '443', '8080', '8443'].includes(parsed.port)) {
    return { valid: false, error: 'Non-standard ports are not allowed' };
  }
  
  return { valid: true };
}

/**
 * Concurrency control
 */
export function acquireAuditSlot(clientId: string): { acquired: boolean; position?: number } {
  if (CONCURRENT_AUDITS.size < MAX_CONCURRENT) {
    CONCURRENT_AUDITS.add(clientId);
    return { acquired: true };
  }
  
  return { acquired: false, position: CONCURRENT_AUDITS.size };
}

export function releaseAuditSlot(clientId: string): void {
  CONCURRENT_AUDITS.delete(clientId);
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(url: string): string {
  return url
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, '') // Remove whitespace
    .toLowerCase();
}

/**
 * Standard API response format
 */
export function createApiResponse(
  status: 'success' | 'error' | 'blocked' | 'queued' | 'rate_limited',
  data?: Record<string, unknown>,
  meta?: Record<string, unknown>,
  message?: string
): Record<string, unknown> {
  const response: Record<string, unknown> = {
    status,
    timestamp: new Date().toISOString(),
  };
  
  if (data) response.data = data;
  if (meta) response.meta = meta;
  if (message) response.message = message;
  
  return response;
}

/**
 * Clean error message (no internal details)
 */
export function sanitizeError(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message;
  
  // Remove file paths, stack traces, internal details
  return message
    .replace(/\/Users\/[^\s]*/g, '[PATH]')
    .replace(/at\s+.*\n?/g, '')
    .replace(/Error:\s*/g, '')
    .trim() || 'An unexpected error occurred';
}

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);
