// CRITICAL: Force Node.js runtime to prevent bundling issues
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditQueue, AuditJob } from '@/lib/queue.service';
import { logger } from '@/utils/logger';
import { AuditError, ErrorCodes, handleError } from '@/utils/errorHandler';
import { 
  getClientId, 
  validateApiKey, 
  checkRateLimit, 
  checkDuplicateRequest,
  validateUrlSecurity, 
  sanitizeUrl,
  acquireAuditSlot,
  releaseAuditSlot,
  createApiResponse,
  sanitizeError
} from '@/lib/security';

// Prisma client (singleton from lib/prisma)

// Clean old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  // This is handled by the security module now
}, 5 * 60 * 1000);

function validateUrl(url: string): string {
  // Trim whitespace
  let validated = url.trim();

  // Check for empty URL
  if (!validated) {
    throw new AuditError({
      message: 'URL is required',
      code: ErrorCodes.INVALID_URL,
      retryable: false,
      statusCode: 400,
    });
  }

  // Add protocol if missing
  if (!validated.startsWith('http://') && !validated.startsWith('https://')) {
    validated = `https://${validated}`;
  }

  // Validate URL format
  try {
    const urlObj = new URL(validated);
    
    // Check for valid hostname
    if (!urlObj.hostname || !urlObj.hostname.includes('.')) {
      throw new AuditError({
        message: 'Invalid URL format',
        code: ErrorCodes.INVALID_URL,
        retryable: false,
        statusCode: 400,
      });
    }

    // Block internal/private IPs
    const hostname = urlObj.hostname;
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('0.') ||
      hostname === '[::1]'
    ) {
      throw new AuditError({
        message: 'Internal URLs are not allowed',
        code: ErrorCodes.INVALID_URL,
        retryable: false,
        statusCode: 400,
      });
    }

    return validated;
  } catch (error) {
    if (error instanceof AuditError) {
      throw error;
    }
    
    throw new AuditError({
      message: 'Invalid URL format',
      code: ErrorCodes.INVALID_URL,
      retryable: false,
      statusCode: 400,
    });
  }
}

// POST /api/audit - Submit a new audit with enhanced security
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Get client identifier
    const clientId = getClientId(request);
    
    // 2. API Key Authentication (optional but recommended)
    const apiKeyCheck = validateApiKey(request);
    if (!apiKeyCheck.valid && process.env.REQUIRE_API_KEY === 'true') {
      return NextResponse.json(
        createApiResponse('error', undefined, { executionTime: Date.now() - startTime }, apiKeyCheck.error),
        { status: 401 }
      );
    }
    
    // 3. Rate Limiting (10 req/min per IP)
    const rateLimit = checkRateLimit(clientId);
    if (!rateLimit.allowed) {
      logger.warn(`Rate limit exceeded for client: ${clientId.substring(0, 20)}`);
      return NextResponse.json(
        createApiResponse(
          rateLimit.blocked ? 'blocked' : 'rate_limited',
          undefined,
          { 
            executionTime: Date.now() - startTime,
            rateLimitRemaining: 0,
            resetIn: Math.ceil(rateLimit.resetIn / 1000)
          },
          rateLimit.blocked ? 'Abuse detected. Cooldown in effect.' : 'Rate limit exceeded. Try again later.'
        ),
        { status: rateLimit.blocked ? 403 : 429 }
      );
    }

    // 4. Parse and sanitize request
    let body: { url?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        createApiResponse('error', undefined, { executionTime: Date.now() - startTime }, 'Invalid JSON body'),
        { status: 400 }
      );
    }
    
    const { url } = body;
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        createApiResponse('error', undefined, { executionTime: Date.now() - startTime }, 'URL is required'),
        { status: 400 }
      );
    }

    // 5. Check for duplicate/spam requests
    if (checkDuplicateRequest(clientId, url)) {
      logger.warn(`Duplicate request detected from ${clientId.substring(0, 20)}`);
      return NextResponse.json(
        createApiResponse('blocked', undefined, { executionTime: Date.now() - startTime }, 'Duplicate request detected. Please wait.'),
        { status: 429 }
      );
    }

    // 6. Comprehensive URL security validation
    const sanitizedUrl = sanitizeUrl(url);
    const urlCheck = validateUrlSecurity(sanitizedUrl);
    
    if (!urlCheck.valid) {
      logger.warn(`Invalid URL rejected: ${urlCheck.error}`, { url: sanitizedUrl.substring(0, 100) });
      return NextResponse.json(
        createApiResponse('error', undefined, { executionTime: Date.now() - startTime }, urlCheck.error || 'Invalid URL'),
        { status: 400 }
      );
    }

    // 7. Concurrency control (max 3 concurrent audits)
    const slot = acquireAuditSlot(clientId);
    if (!slot.acquired) {
      return NextResponse.json(
        createApiResponse(
          'queued',
          { position: slot.position },
          { executionTime: Date.now() - startTime, rateLimitRemaining: rateLimit.remaining },
          'Server at capacity. Request queued.'
        ),
        { status: 202 }
      );
    }

    logger.info(`Audit request validated`, { 
      clientId: clientId.substring(0, 20), 
      url: sanitizedUrl.substring(0, 100),
      rateLimitRemaining: rateLimit.remaining 
    });

    // Generate cache key
    const cacheKey = Buffer.from(sanitizedUrl).toString('base64');

    // Check for cached result (within last hour)
    const cachedAudit = await prisma.audit.findFirst({
      where: {
        cacheKey,
        status: 'completed',
        completedAt: {
          gte: new Date(Date.now() - 3600000), // 1 hour ago
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    if (cachedAudit) {
      logger.info(`Returning cached audit`, { auditId: cachedAudit.id, url: sanitizedUrl });
      
      return NextResponse.json({
        success: true,
        status: 'completed',
        auditId: cachedAudit.id,
        url: sanitizedUrl,
        cached: true,
        result: {
          url: cachedAudit.url,
          performance: {
            score: cachedAudit.performanceScore,
          },
          seo: {
            score: cachedAudit.seoScore,
          },
          accessibility: {
            score: cachedAudit.accessibilityScore,
          },
          bestPractices: {
            score: cachedAudit.bestPracticesScore,
          },
          aiInsights: cachedAudit.riskLevel ? {
            riskLevel: cachedAudit.riskLevel,
            businessImpact: cachedAudit.businessImpact ? JSON.parse(cachedAudit.businessImpact) : [],
            technicalIssues: cachedAudit.technicalIssues ? JSON.parse(cachedAudit.technicalIssues) : [],
            conversionBlockers: cachedAudit.conversionBlockers ? JSON.parse(cachedAudit.conversionBlockers) : [],
            priorityFixes: cachedAudit.priorityFixes ? JSON.parse(cachedAudit.priorityFixes) : [],
          } : null,
          overallScore: cachedAudit.overallScore,
          grade: cachedAudit.grade,
        },
      }, { status: 200 });
    }

    // Create audit record
    const audit = await prisma.audit.create({
      data: {
        url: sanitizedUrl,
        status: 'pending',
        cacheKey,
      },
    });

    logger.info(`Audit record created`, { auditId: audit.id, url: sanitizedUrl });

    // Add job to queue
    const job = await auditQueue.add('audit', {
      url: sanitizedUrl,
      auditId: audit.id,
      retryCount: 0,
    } as AuditJob, {
      jobId: audit.id,
    });

    logger.info(`Audit job queued`, { auditId: audit.id, jobId: job.id });

    // Update audit with job info
    await prisma.audit.update({
      where: { id: audit.id },
      data: { status: 'pending' },
    });

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      status: 'pending',
      auditId: audit.id,
      jobId: job.id,
      url: sanitizedUrl,
      message: 'Audit queued successfully',
      metadata: {
        executionTime,
      },
    }, { status: 202 });

  } catch (error) {
    logger.error(`Audit request failed`, { error: (error as Error).message });

    if (error instanceof AuditError) {
      return NextResponse.json(
        handleError(error, undefined, undefined),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      handleError(error),
      { status: 500 }
    );
  }
}

// GET /api/audit?id={auditId} - Get audit status/result
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get('id');

    if (!auditId) {
      throw new AuditError({
        message: 'Audit ID is required',
        code: ErrorCodes.INVALID_URL,
        retryable: false,
        statusCode: 400,
      });
    }

    logger.info(`Fetching audit status`, { auditId });

    // Get audit from database
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      select: {
        id: true,
        url: true,
        status: true,
        performanceScore: true,
        seoScore: true,
        accessibilityScore: true,
        bestPracticesScore: true,
        overallScore: true,
        grade: true,
        riskLevel: true,
        businessImpact: true,
        technicalIssues: true,
        conversionBlockers: true,
        priorityFixes: true,
        error: true,
        errorCode: true,
        queuedAt: true,
        startedAt: true,
        completedAt: true,
        executionTime: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });

    if (!audit) {
      throw new AuditError({
        message: 'Audit not found',
        code: ErrorCodes.JOB_NOT_FOUND,
        retryable: false,
        statusCode: 404,
      });
    }

    // Build response
    const response: {
      success: boolean;
      status: string;
      auditId: string;
      url: string;
      createdAt: Date;
      updatedAt: Date;
      result?: unknown;
      error?: string;
    } = {
      success: audit.status === 'completed',
      status: audit.status,
      auditId: audit.id,
      url: audit.url,
      createdAt: audit.createdAt,
      updatedAt: audit.updatedAt,
    };

    // Add result if completed
    if (audit.status === 'completed') {
      response.result = {
        url: audit.url,
        performance: {
          score: audit.performanceScore,
        },
        seo: {
          score: audit.seoScore,
        },
        accessibility: {
          score: audit.accessibilityScore,
        },
        bestPractices: {
          score: audit.bestPracticesScore,
        },
        aiInsights: audit.riskLevel ? {
          riskLevel: audit.riskLevel,
          businessImpact: audit.businessImpact ? JSON.parse(audit.businessImpact) : [],
          technicalIssues: audit.technicalIssues ? JSON.parse(audit.technicalIssues) : [],
          conversionBlockers: audit.conversionBlockers ? JSON.parse(audit.conversionBlockers) : [],
          priorityFixes: audit.priorityFixes ? JSON.parse(audit.priorityFixes) : [],
        } : null,
        overallScore: audit.overallScore,
        grade: audit.grade,
        executionTime: audit.executionTime,
      };
    }

    // Add error if failed
    if (audit.status === 'failed' && audit.error) {
      response.error = audit.error;
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    logger.error(`Failed to fetch audit status`, { error: (error as Error).message });

    if (error instanceof AuditError) {
      return NextResponse.json(
        handleError(error),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      handleError(error),
      { status: 500 }
    );
  }
}
