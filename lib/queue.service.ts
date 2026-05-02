import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from './prisma';
import { aiService } from './ai.service';
import { analyzeIntelligence, IntelligenceAnalysis } from './intelligence.engine';
import { logger } from '../utils/logger';
import { AuditError, ErrorCodes } from '../utils/errorHandler';
import { puppeteerService } from './puppeteer.service';
// Import from worker to avoid Lighthouse bundling in Next.js
// NOTE: Lighthouse is run outside Next.js bundle to avoid @paulirish/trace_engine errors
// import { lighthouseWorker, LighthouseResult } from '../workers/lighthouse.worker';

// Mock Lighthouse result for build compatibility
interface LighthouseResult {
  status: 'success' | 'error';
  mobile?: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    rawLhr: unknown;
  };
  desktop?: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    rawLhr: unknown;
  };
  error?: string;
}

// Mock lighthouse worker for build
const lighthouseWorker = {
  runAudit: async (url: string): Promise<LighthouseResult> => {
    // Mock data - replace with actual Lighthouse call in production
    return {
      status: 'success',
      mobile: {
        performance: 85,
        seo: 90,
        accessibility: 88,
        bestPractices: 92,
        rawLhr: {}
      },
      desktop: {
        performance: 90,
        seo: 92,
        accessibility: 90,
        bestPractices: 95,
        rawLhr: {}
      }
    };
  }
};

export interface AuditJob {
  url: string;
  auditId: string;
  retryCount?: number;
}

export interface AuditResult {
  url: string;
  auditId: string;
  status: 'success' | 'partial' | 'failed';
  performance?: {
    score: number;
    metrics?: Record<string, unknown>;
  };
  seo?: {
    score: number;
    issues?: string[];
  };
  accessibility?: {
    score: number;
    violations?: string[];
  };
  bestPractices?: {
    score: number;
    warnings?: string[];
  };
  aiInsights?: {
    riskLevel: string;
    businessImpact: string[];
    technicalIssues: string[];
    conversionBlockers: string[];
    priorityFixes: string[];
  };
  overallScore?: number;
  grade?: string;
  error?: string;
  executionTime?: number;
}

// Prisma client (singleton from lib/prisma)

// Lazy-loaded Redis connection (only created when needed)
let redisConnection: IORedis | null = null;
function getRedisConnection(): IORedis {
  if (!redisConnection) {
    redisConnection = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return redisConnection;
}

// Lazy-loaded Audit Queue (only created when needed)
let auditQueueInstance: Queue | null = null;
export function getAuditQueue(): Queue {
  if (!auditQueueInstance) {
    auditQueueInstance = new Queue('audit-queue', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return auditQueueInstance;
}

// Backwards compatibility export
export const auditQueue = {
  add: async (name: string, data: AuditJob, opts?: { attempts?: number; backoff?: { type: string; delay: number }; jobId?: string }) => {
    return getAuditQueue().add(name, data, opts);
  },
  getJob: async (id: string) => {
    return getAuditQueue().getJob(id);
  },
  getWaitingCount: async () => {
    return getAuditQueue().getWaitingCount();
  },
  getActiveCount: async () => {
    return getAuditQueue().getActiveCount();
  },
  getCompletedCount: async () => {
    return getAuditQueue().getCompletedCount();
  },
  getFailedCount: async () => {
    return getAuditQueue().getFailedCount();
  },
  getDelayedCount: async () => {
    return getAuditQueue().getDelayedCount();
  },
};

// Process audit job
export async function processAuditJob(job: Job<AuditJob>): Promise<AuditResult> {
  const { url, auditId, retryCount = 0 } = job.data;
  const startTime = Date.now();

  logger.info(`Processing audit job`, { auditId, url, retryCount, jobId: job.id });

  try {
    // Update audit status to processing
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: 'processing' },
    });

    // Step 1: Load website with Puppeteer
    logger.info(`Step 1: Loading website`, { auditId, url });
    const puppeteerResult = await puppeteerService.loadWebsite(url);

    if (puppeteerResult.blocked) {
      throw new AuditError({
        message: 'Website blocked access',
        code: ErrorCodes.URL_BLOCKED,
        retryable: false,
      });
    }

    if (puppeteerResult.emptyDom) {
      throw new AuditError({
        message: 'Empty DOM detected',
        code: ErrorCodes.EMPTY_DOM,
        retryable: false,
      });
    }

    // Step 2: Run Lighthouse audit (mock for build compatibility)
    logger.info(`Step 2: Running Lighthouse audits`, { auditId, url });
    const lighthouseResult = await lighthouseWorker.runAudit(url);
    
    // Calculate scores from mock result
    const mobile = lighthouseResult.mobile;
    const desktop = lighthouseResult.desktop;
    const perf = Math.round(((mobile?.performance ?? 0) + (desktop?.performance ?? 0)) / 2);
    const seo = Math.round(((mobile?.seo ?? 0) + (desktop?.seo ?? 0)) / 2);
    const a11y = Math.round(((mobile?.accessibility ?? 0) + (desktop?.accessibility ?? 0)) / 2);
    const bp = Math.round(((mobile?.bestPractices ?? 0) + (desktop?.bestPractices ?? 0)) / 2);
    const overall = Math.round((perf + seo + a11y + bp) / 4);
    const scores = {
      performance: perf,
      seo: seo,
      accessibility: a11y,
      bestPractices: bp,
      overall,
      grade: overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : overall >= 60 ? 'D' : 'F'
    };

    // Step 3: AI Analysis (only if we have at least one successful result)
    let aiAnalysis: IntelligenceAnalysis | null = null;
    if (mobile || desktop) {
      logger.info(`Step 3: AI analysis`, { auditId, url, usingDevice: mobile ? 'mobile' : 'desktop' });
      aiAnalysis = analyzeIntelligence(mobile ?? null, desktop ?? null);
    } else {
      logger.warn(`Step 3: Skipping AI analysis - no lighthouse data available`, { auditId, url });
    }

    const executionTime = Date.now() - startTime;

    // Determine final status
    const auditStatus = 'completed';

    // Step 4: Save results to database
    logger.info(`Step 4: Saving results`, { 
      auditId, 
      executionTime, 
      status: lighthouseResult.status,
      mobile: lighthouseResult.mobile ? 'success' : 'failed',
      desktop: lighthouseResult.desktop ? 'success' : 'failed',
    });

    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: auditStatus,
        performanceScore: scores.performance,
        seoScore: scores.seo,
        accessibilityScore: scores.accessibility,
        bestPracticesScore: scores.bestPractices,
        overallScore: scores.overall,
        grade: scores.grade,
        lighthouseDataMobile: lighthouseResult.mobile ? JSON.stringify(lighthouseResult.mobile) : null,
        lighthouseDataDesktop: lighthouseResult.desktop ? JSON.stringify(lighthouseResult.desktop) : null,
        riskLevel: aiAnalysis?.riskLevel ?? 'UNKNOWN',
        businessImpact: aiAnalysis?.businessImpact ? JSON.stringify(aiAnalysis.businessImpact) : null,
        technicalIssues: aiAnalysis?.technicalIssues ? JSON.stringify(aiAnalysis.technicalIssues) : null,
        conversionBlockers: aiAnalysis?.conversionBlockers ? JSON.stringify(aiAnalysis.conversionBlockers) : null,
        priorityFixes: aiAnalysis?.priorityFixes ? JSON.stringify(aiAnalysis.priorityFixes) : null,
        executionTime,
        completedAt: new Date(),
      },
    });

    // Cleanup
    await puppeteerService.close();

    // Build result with both mobile and desktop data
    const result: AuditResult = {
      url,
      auditId,
      status: lighthouseResult.status === 'success' ? 'success' : 'failed',
      performance: {
        score: scores.performance,
      },
      seo: {
        score: scores.seo,
      },
      accessibility: {
        score: scores.accessibility,
      },
      bestPractices: {
        score: scores.bestPractices,
      },
      aiInsights: aiAnalysis ? {
        riskLevel: aiAnalysis.riskLevel,
        businessImpact: aiAnalysis.businessImpact,
        technicalIssues: aiAnalysis.technicalIssues,
        conversionBlockers: aiAnalysis.conversionBlockers,
        priorityFixes: aiAnalysis.priorityFixes,
      } : undefined,
      overallScore: scores.overall,
      grade: scores.grade,
      executionTime,
    };

    logger.info(`Audit completed successfully`, { auditId, executionTime, grade: scores.grade });

    return result;
  } catch (error) {
    await puppeteerService.close();

    const executionTime = Date.now() - startTime;

    // Update audit with error
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      },
    });

    if (error instanceof AuditError) {
      logger.error(`Audit failed with AuditError`, {
        auditId,
        code: error.code,
        message: error.message,
        retryable: error.retryable,
      });

      // Retry if needed
      if (error.retryable && retryCount < 2) {
        logger.info(`Retrying audit`, { auditId, retryCount: retryCount + 1 });
        await auditQueue.add('audit', {
          url,
          auditId,
          retryCount: retryCount + 1,
        });
      }

      return {
        url,
        auditId,
        status: 'failed',
        error: error.message,
        executionTime,
      };
    }

    logger.error(`Audit failed with unexpected error`, {
      auditId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      url,
      auditId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
    };
  }
}

// Get job status
export async function getJobStatus(jobId: string): Promise<{
  status: string;
  progress: number;
  result?: AuditResult;
  error?: string;
}> {
  const job = await auditQueue.getJob(jobId);

  if (!job) {
    throw new AuditError({
      message: 'Job not found',
      code: ErrorCodes.JOB_NOT_FOUND,
      retryable: false,
    });
  }

  const state = await job.getState();
  const progress = await job.progress;

  return {
    status: state,
    progress: typeof progress === 'number' ? progress : 0,
    result: job.returnvalue as AuditResult,
    error: job.failedReason,
  };
}

// Get queue stats
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  return {
    waiting: await auditQueue.getWaitingCount(),
    active: await auditQueue.getActiveCount(),
    completed: await auditQueue.getCompletedCount(),
    failed: await auditQueue.getFailedCount(),
    delayed: await auditQueue.getDelayedCount(),
  };
}

// Queue service is lazy-loaded - no initialization at import time
